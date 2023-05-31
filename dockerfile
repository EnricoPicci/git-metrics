# Runs the git-metrics tool in a docker container
# The git-metrics tool is executed via the npx command as well as the embedded cloc tool
# The script docker-gitmetrics.sh can be used to run the docker container

# to build
# docker build -t git-metrics .

# to publish
# docker tag cloc-docker-image 290764/git-metrics:git-metrics
# docker push 290764/git-metrics:git-metrics

# to run the local image (assuming the local directory ~/temp/kafka/ contains the git repo)
# docker run --rm -v ~/temp/kafka/:/usr/src/app -v ~/temp/logs/:/outdir git-metrics  -f '*.java' -a 2023-01-01 -d /outdir

# to run the published image (assuming the local directory ~/temp/kafka/ contains the git repo)
# docker run --rm -v ~/temp/kafka/:/usr/src/app -v ~/temp/logs/:/outdir 290764/git-metrics:git-metrics  -f '*.java' -a 2023-01-01 -d /outdir

# Use the node image as the base image
FROM node:16

# Create app directory
WORKDIR /usr/src/app

ENTRYPOINT ["npx", "git-metrics" ]

# default command
CMD [ "--help" ]
