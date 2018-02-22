---
categories:
- docker
date: 2016-01-16T00:00:00Z
draft: true
excerpt: Docker is a very cool tool.
tags:
- docker
- tricks
title: Useful docker tricks
---

Remove all containers:

```
docker rm $(docker ps -a -q)
```

Remove untagged containers:

```
REPOSITORY                   TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
<none>                       <none>              0bd00ea2cff9        13 hours ago        644.6 MB
<none>                       <none>              51c22d84b21e        13 hours ago        644.6 MB
<none>                       <none>              fce9c492f6b3        13 hours ago        644.6 MB
```

```
docker rmi $(docker images -q --filter "dangling=true")
```

Remove terminated containers:

```
docker rm $(docker ps -afq "status=exited")
```

Create an ssh tunnel to have containers running in docker-machine on your localhost:

```
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -L 8080:localhost:8080 -i ~/.docker/machine/machines/default/id_rsa docker@(docker-machine ip default)
```

Docker API:
http://www.virtuallyghetto.com/2014/07/quick-tip-how-to-enable-docker-remote-api.html
