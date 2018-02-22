---
categories:
- VM
date: 2016-02-08T00:00:00Z
draft: true
description: Heap vs Perm
tags:
- memory
- java
title: VM settings
---

http://stackoverflow.com/questions/4848669/perm-space-vs-heap-space

The heap stores all of the objects created by your Java program. The heap's contents is monitored by the garbage collector, which frees memory from the heap when you stop using an object (i.e. when there are no more references to the object.

This is in contrast with the stack, which stores primitive types like ints and chars, and are typically local variables and function return values. These are not garbage collected.

http://stackoverflow.com/questions/1279449/what-is-perm-space

The permanent generation is special because it holds meta-data describing user classes (classes that are not part of the Java language). Examples of such meta-data are objects describing classes and methods and they are stored in the Permanent Generation. Applications with large code-base can quickly fill up this segment of the heap which will cause java.lang.OutOfMemoryError: PermGen no matter how high your -Xmx and how much memory you have on the machine.

----

Personally, I wouldn't consider PermGen a special part of the heap.

I'd much prefer to think of heap as a memory area dedicated to store object instances while PermGen as an area dedicated to store class definitions. As a result, a heap's lifecycle is tied to an application while PermGen's lifecycle is tied to a JVM.

One of the best examples why an application and its JVM can have different lifecycle is in a Java EE container. In an app server, applications can be deployed and undeployed without restarting the server. During the undeployment (or redeployment), it's easy to release all the object instances i.e. heap space, but it's rather tricky to clear all the classes loaded by this app from PermGen because some of the classes can still be referenced by the JVM.

One of such case is the Leaking Drivers. When an app is deployed, a JDBC driver is loaded and registered with the DriverManager. When this app is undeployed, the DriverManager lives on and holds a reference to the driver, its original class loader, and everything this class loader loaded. As a result, a memory leak in PermGen is created, but it's no fault of the application's memory management.

It's true that JVMs like JRocket don't have PermGen at all, everything is stored in heap. Only in such context can you call PermGen a "special part" of heap. Even then, we should still view PermGen and heap differently since they have very different purpose and they have very different types of memory leaks.

Update: In Oracle's JDK 8, PermGen is replaced by "Metaspace" and it is now officially part of the heap. We won't need to specifically tune PermGen any more.


http://www.mkyong.com/java/find-out-your-java-heap-memory-size/

```
java -XX:+PrintFlagsFinal -version | grep -iE 'HeapSize|PermSize|ThreadStackSize'
```

http://www.avricot.com/blog/?post/2010/05/03/Get-started-with-java-JVM-memory-(heap%2C-stack%2C-xss-xms-xmx-xmn...)

# Heap

http://www.avricot.com/blog/public/jvm/memoryJVM.png
http://www.oracle.com/ocom/groups/public/@otn/documents/digitalasset/190244.gif

Full, complex article: http://www.oracle.com/technetwork/java/javase/gc-tuning-6-140523.html

* -Xmx : max heap size (ex: -Xmx1024)
* -Xms : min heap size. Having -Xms = 1.8GB (32bit) can be bad, because you don't let memory for anything else.
* -Xmn : the size of the heap for the young generation
Young generation represents all the objects which have a short life of time. Young generation objects are in a specific location into the heap, where the garbage collector will pass often. All new objects are created into the young generation region (called "eden"). When an object survive is still "alive" after more than 2-3 gc cleaning, then it will be swap has an "old generation" : they are "survivor" .
Good size is 33%
* -XX:NewRatio : the same as Xmn, but using a % (dynamic fs static -Xmn option). -XX:NewRatio=3 means that the ratio between the old and young generation is 1:3
* -XX:NewSize - Size of the young generation at JVM init. Calculated automatically if you specify -XX:NewRatio
* -XX:MaxNewSize - The largest size the young generation can grow to (unlimited if this value is not specified at command line)
* -XX:SurvivorRatio : "old generation" called tenured generation, ratio, in %. For example, -XX:SurvivorRatio=6 sets the ratio between each survivor space and eden to be 1:6 (eden is where new objects are created)
* -XX:MinHeapFreeRatio: default is 40%. JVM will allocate memory to always have as minimum 40% of free memory. When -Xmx = -Xms, it's useless.
* -XX:MaxHeapFreeRatio: default is 70%. The same as Min, to avoid unecessary memory allocation.

# The rest

* Permanent Space : It's the third part of the memory. Here are stored classes, methods etc.
  * -XX:PermSize: initial value
  * -XX:MaxPermSize: max value
* Code generation : Converted byte code into native code. Shouldn't cause troubles.
* Socket Buffer (contains the 2 buffers for each sockets: receive/send)
Thread Stacks: Each thread has its own stack. It makes possible to get your methods thread-safe.
    * -Xss: change the space of a thread stack. 2048 could be a write value. It can cause a java.lang.stackOverFlow Error
    * If you get a "java.lang.OutOfMemoryError : unable to create new native Thread, you can decrease -Xss or decrease the java heap using -Xmx/-Xms (to increase the thread stack space)
* Direct memory space (ability to let Java developers map memory outside the Java Object Heap. Can be adjusted using -XX:MaxDirectMemory=
* JNI Code, if you use it
* Garbage Collection (the GC has its own thread/informations)

Major collection doesn't run until tenured is full.
This mean that using -Xmx1024, current heap could be 750MB with 500MB of "dead" object. If the JVM is idle, it could stay like that during a very long time => wasting 500MB or RAM for an idle JVM !
