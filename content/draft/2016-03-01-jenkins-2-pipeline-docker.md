---
categories:
- CI
date: 2016-03-01T00:00:00Z
draft: true
description: How to make the jenkins pipeline work with jenkins (on a Mac)
tags:
- docker
- jenkins
title: Jenkins 2.0 pipeline with docker
---

http://stackoverflow.com/questions/34352436/docker-build-and-publish-plugin-usage


Client key:
/Users/geowarin/.docker/machine/machines/default/key.pem

Client certificate:
/Users/geowarin/.docker/machine/machines/default/cert.pem

Server CA certificate:
/Users/geowarin/.docker/machine/machines/default/ca.pem

```
docker
--host=tcp://192.168.99.100:2376
--tlsverify
--tlskey=/Users/geowarin/.docker/machine/machines/default/key.pem  (getClientKey)
--tlscert=/Users/geowarin/.docker/machine/machines/default/cert.pem  (getClientCertificate)
--tlscacert=/Users/geowarin/.docker/machine/machines/default/ca.pem (getServerCaCertificate)
images
```

Example workflow:

```groovy
node {
    env.PATH = "/usr/local/bin:${env.PATH}"
    docker.withServer('tcp://192.168.99.100:2376', 'docker-machine') {

        // https://registry.hub.docker.com/_/maven/
        def maven32 = docker.image('maven:3.2-jdk-7-onbuild');

        stage 'Mirror'
        // First make sure the slave has this image.
        // (If you could set your registry below to mirror Docker Hub,
        // this would be unnecessary as maven32.inside would pull the image.)
        maven32.pull()
        // We are pushing to a private secure docker registry in this demo.
        // 'docker-registry-login' is the username/password credentials ID
        // as defined in Jenkins Credentials.
        // This is used to authenticate the docker client to the registry.
        docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {

            stage 'Build'

            // spin up a Maven container to build the petclinic app from source
            // (we are only using -v here to share the Maven local repository across demo runs;
            // otherwise would set localRepository=${pwd}/m2repo)
            maven32.inside('-v /m2repo:/m2repo') {
                // Check out the source code.
                git 'https://github.com/tfennelly/spring-petclinic.git'

                // Set up a shared Maven repo so we don't need to download all dependencies on every build.
                writeFile file: 'settings.xml',
                        text: '<settings><localRepository>/m2repo</localRepository></settings>'
                // Build with Maven settings.xml file that specs the local Maven repo.
                sh 'mvn -B -s settings.xml clean install -DskipTests'

                // The app .war and Dockerfile are now available in the workspace. See below.
            }

            stage 'Bake Docker image'
            // use the spring-petclinic Dockerfile (see above 'maven32.inside()' block)
            // to build container that can run the app. The Dockerfile is in the cwd of the active workspace
            // (see above maven32.inside() block), so we pass '.' as the build PATH param. The Dockerfile
            // (see https://github.com/tfennelly/spring-petclinic/blob/master/Dockerfile) expects the petclinic.war
            // file to be in the 'target' dir of the workspace, which will be the case.
            def pcImg = docker.build("examplecorp/spring-petclinic:${env.BUILD_TAG}", '.')

            // Let's tag and push the newly built image. Will tag using the image name provided
            // in the 'docker.build' call above (which included the build number on the tag).
            pcImg.push();

            stage 'Test Image'
            // Run the petclinic app in its own docker container
            pcImg.withRun {petclinic ->
                // Spin up a maven test container, linking it to the petclinic app container allowing
                // the maven tests to fire HTTP requests between the containers.
                maven32.inside("-v /m2repo:/m2repo --link=${petclinic.id}:petclinic") {
                    git 'https://github.com/tfennelly/spring-petclinic-tests.git'

                    writeFile file: 'settings.xml',
                            text: '<settings><localRepository>/m2repo</localRepository></settings>'
                    sh 'mvn -B -s settings.xml clean package'
                }
            }

            stage name: 'Promote Image', concurrency: 1
            // All the tests passed. We can now retag and push the 'latest' image
            pcImg.push('latest');

        }
    }
}
```

Workflow with picture:

```groovy
node {
  git '/tmp/repo'

  def maven = docker.image('maven:3.3.3-jdk-8'); // https://registry.hub.docker.com/_/maven/

  stage 'Mirror'
  // First make sure the slave has this image.
  // (If you could set your registry below to mirror Docker Hub,
  // this would be unnecessary as maven.inside would pull the image.)
  maven.pull()
  // We are pushing to a private secure Docker registry in this demo.
  // 'docker-registry-login' is the username/password credentials ID as defined in Jenkins Credentials.
  // This is used to authenticate the Docker client to the registry.
  docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {

    stage 'Build'
    // Spin up a Maven container to build the petclinic app from source.
    // First set up a shared Maven repo so we don't need to download all dependencies on every build.
    // (we are only using -v here to share the Maven local repository across demo runs;
    // otherwise would set -Dmaven.repo.local=${pwd()}/m2repo)
    maven.inside('-v /m2repo:/m2repo') {
      sh 'mvn -Dmaven.repo.local=/m2repo -f app -B -DskipTests clean package'
      // The app .war and Dockerfile are now available in the workspace. See below.
    }

    stage 'Bake Docker image'
    // Use the spring-petclinic Dockerfile (see above 'maven.inside()' block)
    // to build a container that can run the app.
    // The Dockerfile is in the app subdir of the active workspace
    // (see above maven.inside() block), so we specify that.
    // The Dockerfile expects the petclinic.war file to be in the 'target' dir
    // relative to its own directory, which will be the case.
    def pcImg = docker.build("examplecorp/spring-petclinic:${env.BUILD_TAG}", 'app')

    // Let us tag and push the newly built image. Will tag using the image name provided
    // in the 'docker.build' call above (which included the build number on the tag).
    pcImg.push();

    stage 'Test Image'
    // Spin up a Maven + Xvnc test container, linking it to the petclinic app container
    // allowing the Maven tests to send HTTP requests between the containers.
    def testImg = docker.build('examplecorp/spring-petclinic-tests:snapshot', 'test')
    // Run the petclinic app in its own Docker container.
    pcImg.withRun {petclinic ->
      testImg.inside("-v /m2repo:/m2repo --link=${petclinic.id}:petclinic") {
        // https://github.com/jenkinsci/workflow-plugin/blob/master/basic-steps/CORE-STEPS.md#build-wrappers
        wrap([$class: 'Xvnc', takeScreenshot: true, useXauthority: true]) {
          sh 'mvn -Dmaven.repo.local=/m2repo -f test -B clean test'
        }
      }
    }
    input "How do you like ${env.BUILD_URL}artifact/screenshot.jpg?"

    stage name: 'Promote Image', concurrency: 1
    // All the tests passed. We can now retag and push the 'latest' image.
    pcImg.push('latest');    
  }
}

```

docker compose:
https://github.com/docker/compose/issues/1874#issuecomment-131780195

docker-compose down
