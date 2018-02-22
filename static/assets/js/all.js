'use strict';

var EPOCHS = {
  year: 31536000,
  month: 2592000,
  day: 86400,
  hour: 3600,
  minute: 60
};

var getDuration = function getDuration(seconds) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(EPOCHS)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var epoch = _step.value;

      var interval = Math.floor(seconds / EPOCHS[epoch]);
      if (interval >= 1) {
        return { interval: interval, epoch: epoch };
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

var timeAgo = function timeAgo(date) {
  var timeAgoInSeconds = Math.floor((new Date() - new Date(date)) / 1000);

  var _getDuration = getDuration(timeAgoInSeconds);

  var interval = _getDuration.interval;
  var epoch = _getDuration.epoch;

  var suffix = interval === 1 ? '' : 's';
  return interval + ' ' + epoch + suffix + ' ago';
};

function getFeed() {
  axios.get('https://api.github.com/users/geowarin/events').then(function (feed) {
    return _(feed.data)
    //.filter((item) => item.repo != undefined)
    .map(function (item) {
      if (item.type === 'WatchEvent') {
        var _name = item.repo.name;
        return timeAgo(item.created_at) + ', I watched <a href=\'https://github.com/' + _name + '\'>' + _name + '</a>';
      }
      if (item.type === 'CreateEvent') {
        var _name2 = item.repo.name;
        return timeAgo(item.created_at) + ', I created <a href=\'https://github.com/' + _name2 + '\'>' + _name2 + '</a>';
      }
    }).filter(function (item) {
      return item != null;
    }).value();
  }).then(function (links) {
    links.forEach(function (link) {
      $('#feed').append('<li>' + link + '</li>');
    });
  });
  axios.get('https://api.github.com/users/geowarin/starred', { headers: {
      'Accept': 'application/vnd.github.v3.star+json'
    } }).then(function (feed) {
    return _(feed.data)
    //.filter((item) => item.repo != undefined)
    .map(function (item) {
      var name = item.repo.full_name;
      return timeAgo(item.starred_at) + ', I starred <a href=\'https://github.com/' + name + '\'>' + name + '</a>';
    }).filter(function (item) {
      return item != null;
    }).value();
  }).then(function (links) {
    links.forEach(function (link) {
      $('#feed').append('<li>' + link + '</li>');
    });
  });
}
// Highlight current nav item
'use strict';

function levensthein(first, second) {
  if (first === second) return 0;

  var v0 = [];
  var v1 = [];

  for (var i = 0; i < second.length + 1; i++) {
    v0[i] = i;
  }

  for (var i = 0; i < first.length; i++) {
    // calculate v1 (current row distances) from the previous row v0
    v1[0] = i + 1;

    // use formula to fill in the rest of the row
    for (var j = 0; j < second.length; j++) {
      var cost = first[i] == second[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }

    // copy v1 (current row) to v0 (previous row) for next iteration
    for (var j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[second.length];
}

var firstTitle = $('.page-title-link').text().toUpperCase();
var links = $('#main-nav > li > .main-nav-list-link');

var bestLink = _(links.toArray()).min(function (link) {
  return levensthein(firstTitle, $(link).text().toUpperCase());
});
$(bestLink).addClass('current');

// Sidebar expend
$('#sidebar .sidebar-toggle').click(function () {
  if ($('#sidebar').hasClass('expend')) $('#sidebar').removeClass('expend');else $('#sidebar').addClass('expend');
});
// Nav bar toggle
'use strict';

$('#main-nav-toggle').on('click', function () {
  $('.nav-container-inner').slideToggle();
});

// anchors
anchors.options.visible = 'hover';
anchors.add('.article-inner h2');

// fast click
$(function () {
  FastClick.attach(document.body);
});

// Captions
$('.article-entry').each(function (i) {
  $(this).find('img').each(function () {
    if ($(this).parent().hasClass('fancybox')) return;

    var alt = this.alt;

    if (alt) $(this).after('<span class="caption">' + alt + '</span>');

    $(this).wrap('<a href="' + this.src + '" title="' + alt + '" class="fancybox"></a>');
  });

  $(this).find('.fancybox').each(function () {
    $(this).attr('rel', 'article' + i);
  });
});

if ($.fancybox) {
  $('.fancybox').fancybox();
}

//Back to top
$("#back-to-top").on('click', function () {
  $('body,html').animate({
    scrollTop: 0
  }, 600);
});
'use strict';

var postTemplate = _.template(['<div class="article-row">', ' <article class="article article-summary full-width">', '   <div class="article-summary-inner">', '      <h2 class="article-title">', '        <a href="<%= post.url %>" class="title"><%= post.title %></a>', '      </h2>', '      <p class="article-excerpt">', '        <%= post.excerpt %>', '      </p>', '    </div>', '  </article>', '</div>'].join(''));

var search = function search(posts) {

  var queryParams = (function (queries) {
    if (queries == "") return {};

    var params = {};
    for (var i = 0; i < queries.length; ++i) {
      var param = queries[i].split('=', 2);
      if (param.length == 1) params[param[0]] = "";else params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
    }
    return params;
  })(window.location.search.substr(1).split('&'));

  var searched = queryParams['q'];
  $('.page-title-link').text('Search for "' + searched + '"');
  $('#search-form-wrap input').val(searched);

  var searchRegex = new RegExp(searched, 'i');
  _(posts).filter(function (post) {
    var categoryMatch = _.any(post.categories, function (test) {
      return searchRegex.test(test);
    });
    return categoryMatch || post.excerpt.match(searchRegex) || post.title.match(searchRegex);
  }).forEach(function (match) {
    $('#search-results').append(postTemplate({ post: match }));
  }).value();
};
'use strict';

var providers = {
  twitter: {
    countUrl: 'http://opensharecount.com/count.json?url={url}&callback=?',
    postUrl: 'https://twitter.com/intent/tweet?url={url}&via=geowarin&text={title}',
    getCount: function getCount(result) {
      return result && result.count;
    }
  },
  linkedIn: {
    countUrl: 'https://www.linkedin.com/countserv/count/share?format=jsonp&url={url}&callback=?',
    postUrl: 'http://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}',
    getCount: function getCount(result) {
      return result.count;
    }
  },
  facebook: {
    countUrl: 'https://graph.facebook.com/fql?q=SELECT%20url,%20normalized_url,%20share_count,%20like_count,%20comment_count,%20total_count,commentsbox_count,%20comments_fbid,%20click_count%20FROM%20link_stat%20WHERE%20url=%27{url}%27&callback=?',
    postUrl: 'http://www.facebook.com/sharer/sharer.php?u={url}&t={title}',
    getCount: function getCount(result) {
      return result.data[0].share_count;
    }
  },
  google: {
    countUrl: null,
    postUrl: 'https://plus.google.com/share?&url={url}',
    getCount: function getCount(result) {
      return '';
    }
  }
};

$('.article-share-links').each(function () {
  var $links = $(this);
  var articleUrl = $links.attr('data-url');
  var articleTitle = $links.attr('data-title');
  var encodedUrl = encodeURIComponent(articleUrl);

  var shareButtons = $links.find('a');
  $(shareButtons).each(function () {

    var $link = $(this);
    var linkProvider = $link.attr('data-provider');
    var provider = providers[linkProvider];

    if (provider) {

      if (provider.countUrl) {
        var url = provider.countUrl.replace('{url}', encodedUrl);
        $.getJSON(url, function (result) {
          var count = provider.getCount(result);
          $link.find('.count').text(count);
        });
      } else {
        var count = provider.getCount(null);
        $link.find('.count').text(count);
      }

      var href = provider.postUrl.replace('{url}', articleUrl).replace('{title}', articleTitle);
      $link.attr('href', href).on('click', function (e) {
        return !window.open(href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
      });
    }
  });
});
//# sourceMappingURL=all.js.map