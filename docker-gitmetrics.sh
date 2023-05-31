#!/bin/bash
#
# This script can be used to run the git-metrics docker container.
# It is used to pass the arguments to the docker command.
# The first argument is the source directory.
# The outDir is mandatory and it is passed with the -d or --outDir option.
# All the other arguments are passed to the docker command.
#
# Examples:
# sh docker-gitmetrics.sh $PWD -f \'*.ts\' -a 2023-01-01 -d ~/temp/logs/
# sh docker-gitmetrics.sh $PWD -f \'*.ts\' -a 2023-01-01 -d $(dirname "$PWD")/logs/

# https://medium.com/@BioCatchTechBlog/passing-arguments-to-a-docker-container-299d042e5ce

if [ $# -lt 1 ]
then
echo At least 1 argument expected: the source directory.
exit 1
fi

# store in args_array var the array of the arguments passed to the script from the command line
args_array=("$@")

# the source directory is the first argument
srcDir=${args_array[0]}

outdir=""

for (( c=1; c<=$#; c++ ))
do 
    # the outdir is the argument after the -d or --outDir   
   if [ "${args_array[$c]}" = "-d" ] || [ "${args_array[$c]}" = "--outDir" ]
   then
      outdir=${args_array[$((c+1))]}
      c=$((c+1))
      continue
   fi
   # all the other arguments are passed to the docker command
   params="${params} ${args_array[$c]}"
done

if [ -z "${outdir}" ]
# the outDir is mandatory
then
    echo "outdir is not specified. Please specify it with -d or --outDir option."
    exit 1
fi
command="docker run --rm -v ${srcDir}:/usr/src/app -v ${outdir}:/outdir 290764/git-metrics:git-metrics ${params} -d /outdir" 

# run the docker command
echo ">>>>>>>>>>>> Executing command: ${command}"
eval "${command}"
