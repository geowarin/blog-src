---
categories:
- blogging
date: 2014-01-09T23:00:00Z
description: What is Jekyll and how to migrate from worpress
tags:
- wordpress
- jekyll
title: How (and why) I migrated from wordpress to jekyll
---

I've been blogging on wordpress for a year now or rather I used to blog with great enthusiasm at first.
Then, enthusiasm turned into frustration until I let go. Wordpress is too heavy, difficult to personalize and makes it hard to post code snippets.

In this post I'll tell you what Jekyll is, how it got the geek in me back to blogging merrily and how I migrated from wordpress without too much sweat.

I will tell you how :

* Migrate your blog entries
* Migrate your comments
* Get a rss feed
* Automatically tweet your new posts

<!--more-->

## What is jekyll


[Jekyll](http://jekyllrb.com/) is a static website generator, in other words it turns the content of your posts, written in [markdown](http://fr.wikipedia.org/wiki/Markdown) into plain html pages.

Advantages include :

* It's blazing fast
* It has powerful [templating engine](http://liquidmarkup.org/)
* It's hosted on github for [free](http://pages.github.com/)
* Powerful pre-treatments features great [syntax highlighting](http://pygments.org/)
* Publication is easy as a git push ! (yeah... it's not for your grandma)

With these details you can catch a glimpse at why Jekyll has become popular
amongst the technical blog writers.

## The stack

That said, when you choose Jekyll you are pretty much on your own. You have to develop and choose how you will handle comments, analytics and layout.

A popular solution is to use [octopress](http://octopress.org).

But real geeks do it on their own. Here is my stack :

* Stylus to write better CSS. Since I suck at writing stylesheets, I used
[a theme from hexo](https://github.com/ppoffice/hexo-theme-hueman) as a starter
* [Font awesome](http://fontawesome.io/) for gyphicons, which I like even if their not [as hype](http://ianfeather.co.uk/ten-reasons-we-switched-from-an-icon-font-to-svg/) as they used to be.
* Google analytics
* [Disqus](http://disqus.com/) for the comments

All in all, these are pretty common choices but they are easy to get working together.
Let's see...

## How to migrate from wordpress to jekyll

1. First, you have to [export](http://en.support.wordpress.com/export/) everything from your existing blog.
2. To translate my posts to markdow, I chose [exitwp](https://github.com/thomasf/exitwp)
3. Migrate your comments to disqus. This is a two step process :
	* First [import them](http://help.disqus.com/customer/portal/articles/466255-importing-comments-from-wordpress) for the xml extracted from wordpress
	* Then do a [domain migration](http://help.disqus.com/customer/portal/articles/912627-domain-migration-wizard) to map the imported comments to your new domain
4. I then bought a 11€ one year redirection from wordpress to my new domain. The trick here is to use the [permalink](http://grinnick.com/posts/how-to-manage-permalinks-in-jekyll) attribute in jekyll post to be sure to map the exact same urls as before for your old articles (exitwp will generate that for you under the unused attribute `slug`, you just have to rename that)
5. I used [this repo](https://github.com/snaptortoise/jekyll-rss-feeds) to generate my rss feeds. Too easy.
6. I registered a recipe on my rss feed on [ifttt](https://ifttt.com) to tweet automatically when it detects a new item in my feed.
7. Don't forget the [sitemap](https://github.com/geowarin/geowarin.github.com/blob/master/sitemap.txt), to add meta keywords in your main page and to aggressively link everything you own to your new blog !

Bonus : the snippets to set up [disqus](http://help.disqus.com/customer/portal/articles/472097-universal-embed-code) and [google analytics](https://developers.google.com/analytics/devguides/collection/gajs/asyncTracking).


## Conclusion

I am happy to have moved to Jekyll. It has made blogging fun again.
I won't recommend it to everyone, thought.

Wordpress got me blogging and for that I will be forever grateful.
But it often felt as an inadequate tool for a developer and Jekyll remedies that.
The learning curve is not too steep, your old content is not lost and I feel the investment is worth it !
