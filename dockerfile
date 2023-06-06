# Runs the git-metrics tool in a docker container
# The git-metrics tool is executed via the npx command as well as the embedded cloc tool
# The script docker-gitmetrics.sh can be used to run the docker container

# to build
# docker build -t git-metrics .

# to publish
# docker tag git-metrics 290764/git-metrics:git-metrics
# docker push 290764/git-metrics:git-metrics

# to run the local image (assuming the local directory ~/temp/kafka/ contains the git repo)
# docker run --rm -v ~/temp/kafka/:/usr/src/app -v ~/temp/logs/:/outdir git-metrics  -f '*.java' -a 2023-01-01 -d /outdir

# to run the published image (assuming the local directory ~/temp/kafka/ contains the git repo)
# docker run --rm -v ~/temp/kafka/:/usr/src/app -v ~/temp/logs/:/outdir 290764/git-metrics:git-metrics  -f '*.java' -a 2023-01-01 -d /outdir

# Use the node image as the base image
FROM node:16

# Create app directory
WORKDIR /git-metrics

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

WORKDIR /usr/src/app

# npm exec --pacakge=git-metrics -- run-all-reports-on-merged-repos -f '*.java' '*.swift' -a 2021-01-01 -d ../logs
# npx -p git-metrics run-all-reports-on-merged-repo
# ENTRYPOINT ["npx", "git-metrics" ]
ENTRYPOINT ["node", "/git-metrics/dist/3-lib/run-reports-on-merged-repos.js"]

# default command
CMD [ "--help" ]
