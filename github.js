// Generated by CoffeeScript 1.3.3
(function() {
  var Github, encode, err, jQuery, makeGithub, najax, _,
    _this = this;

  makeGithub = function(_, jQuery, base64encode) {
    var Github;
    Github = (function() {
      var Authenticated, Gist, Repository, User, listeners, _request;

      _request = null;

      listeners = [];

      function Github(options) {
        if (options == null) {
          options = {};
        }
        options.rootURL = options.rootURL || 'https://api.github.com';
        listeners = [];
        _request = function(method, path, data, raw, isBase64) {
          var getURL, xhr,
            _this = this;
          getURL = function() {
            var url;
            url = options.rootURL + path;
            return url + (/\?/.test(url) ? '&' : '?') + (new Date()).getTime();
          };
          xhr = jQuery.ajax({
            url: getURL(),
            type: method,
            contentType: 'application/json',
            headers: {
              'Accept': 'application/vnd.github.raw',
              'User-Agent': 'github-client'
            },
            processData: false,
            data: !raw && data && JSON.stringify(data) || data,
            dataType: !raw ? 'json' : void 0,
            beforeSend: function(xhr) {
              var auth;
              if (isBase64) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
              if ((options.auth === 'oauth' && options.token) || (options.auth === 'basic' && options.username && options.password)) {
                if (options.auth === 'oauth') {
                  auth = "token " + options.token;
                } else {
                  auth = 'Basic ' + base64encode("" + options.username + ":" + options.password);
                }
                return xhr.setRequestHeader('Authorization', auth);
              }
            },
            complete: function(xhr, xmlhttpr) {
              var listener, rateLimit, rateLimitRemaining, _i, _len, _results;
              rateLimit = parseFloat(xhr.getResponseHeader('X-RateLimit-Limit'));
              rateLimitRemaining = parseFloat(xhr.getResponseHeader('X-RateLimit-Remaining'));
              _results = [];
              for (_i = 0, _len = listeners.length; _i < _len; _i++) {
                listener = listeners[_i];
                _results.push(listener(rateLimitRemaining, rateLimit));
              }
              return _results;
            }
          });
          return xhr.then(function(data, textStatus, jqXHR) {
            var converted, i, ret, _i, _ref;
            ret = new jQuery.Deferred();
            if ('GET' === method && isBase64) {
              converted = '';
              for (i = _i = 0, _ref = data.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
                converted += String.fromCharCode(data.charCodeAt(i) & 0xff);
              }
              converted;

              return ret.resolve(converted, textStatus, jqXHR);
            } else {
              return ret.resolve(data, textStatus, jqXHR);
            }
          }).then(null, function(xhr, msg, desc) {
            var json;
            if (xhr.getResponseHeader('Content-Type') !== 'application/json; charset=utf-8') {
              return {
                error: xhr.responseText,
                status: xhr.status,
                _xhr: xhr
              };
            }
            json = JSON.parse(xhr.responseText);
            return {
              error: json,
              status: xhr.status,
              _xhr: xhr
            };
          }).promise();
        };
      }

      Github.prototype.onRateLimitChanged = function(listener) {
        return listeners.push(listener);
      };

      Github.prototype.getZen = function() {
        return _request('GET', '/zen', null, true);
      };

      Github.prototype.getOrgRepos = function(orgName) {
        return _request('GET', "/orgs/" + orgName + "/repos?type=all&per_page=1000&sort=updated&direction=desc", null);
      };

      Authenticated = (function() {

        function Authenticated() {}

        Authenticated.prototype.getInfo = function() {
          return _request('GET', "/user", null);
        };

        Authenticated.prototype.getRepos = function() {
          return _request('GET', '/user/repos?type=all&per_page=1000&sort=updated', null);
        };

        Authenticated.prototype.getOrgs = function() {
          return _request('GET', '/user/orgs', null);
        };

        Authenticated.prototype.getGists = function() {
          return _request('GET', '/gists', null);
        };

        Authenticated.prototype.getNotifications = function() {
          return _request('GET', '/notifications', null);
        };

        return Authenticated;

      })();

      User = (function() {

        function User(username) {
          this.username = username;
        }

        User.prototype.getInfo = function() {
          return _request('GET', "/users/" + this.username, null);
        };

        User.prototype.getRepos = function() {
          return _request('GET', "/users/" + this.username + "/repos?type=all&per_page=1000&sort=updated", null);
        };

        User.prototype.getOrgs = function() {
          return _request('GET', "/users/" + this.username + "/orgs", null);
        };

        User.prototype.getGists = function() {
          return _request('GET', "/users/" + this.username + "/gists", null);
        };

        User.prototype.follow = function() {
          return _request('PUT', "/user/following/" + this.username, null);
        };

        User.prototype.unfollow = function() {
          return _request('DELETE', "/user/following/" + this.username, null);
        };

        return User;

      })();

      Repository = (function() {

        function Repository(options) {
          var repo, user;
          this.options = options;
          repo = this.options.name;
          user = this.options.user;
          this.repoPath = "/repos/" + user + "/" + repo;
          this.currentTree = {
            branch: null,
            sha: null
          };
        }

        Repository.prototype._updateTree = function(branch) {
          var _this = this;
          if (branch === this.currentTree.branch && this.currentTree.sha) {
            return (new jQuery.Deferred()).resolve(this.currentTree.sha);
          }
          return this.getRef("heads/" + branch).then(function(sha) {
            _this.currentTree.branch = branch;
            _this.currentTree.sha = sha;
            return sha;
          }).promise();
        };

        Repository.prototype.getRef = function(ref) {
          var _this = this;
          return _request('GET', "" + this.repoPath + "/git/refs/" + ref, null).then(function(res) {
            return res.object.sha;
          }).promise();
        };

        Repository.prototype.createRef = function(options) {
          return _request('POST', "" + this.repoPath + "/git/refs", options);
        };

        Repository.prototype.deleteRef = function(ref) {
          return _request('DELETE', "" + this.repoPath + "/git/refs/" + ref, this.options);
        };

        Repository.prototype.listBranches = function() {
          var _this = this;
          return _request('GET', "" + this.repoPath + "/git/refs/heads", null).then(function(heads) {
            return _.map(heads, function(head) {
              return _.last(head.ref.split("/"));
            });
          }).promise();
        };

        Repository.prototype.getBlob = function(sha, isBinary) {
          return _request('GET', "" + this.repoPath + "/git/blobs/" + sha, null, 'raw', isBinary);
        };

        Repository.prototype.getSha = function(branch, path) {
          var _this = this;
          if (path === '') {
            return this.getRef("heads/" + branch);
          }
          return this.getTree("" + branch + "?recursive=true").then(function(tree) {
            var file;
            file = _.select(tree, function(file) {
              return file.path === path;
            })[0];
            if (file != null ? file.sha : void 0) {
              return file != null ? file.sha : void 0;
            }
            return (new jQuery.Deferred()).reject({
              message: 'SHA_NOT_FOUND'
            });
          }).promise();
        };

        Repository.prototype.getTree = function(tree) {
          var _this = this;
          return _request('GET', "" + this.repoPath + "/git/trees/" + tree, null).then(function(res) {
            return res.tree;
          }).promise();
        };

        Repository.prototype.postBlob = function(content, isBase64) {
          var _this = this;
          if (typeof content === 'string') {
            content = {
              content: content,
              encoding: 'utf-8'
            };
          }
          if (isBase64) {
            content.encoding = 'base64';
          }
          return _request('POST', "" + this.repoPath + "/git/blobs", content).then(function(res) {
            return res.sha;
          }).promise();
        };

        Repository.prototype.updateTree = function(baseTree, path, blob) {
          var data,
            _this = this;
          data = {
            base_tree: baseTree,
            tree: [
              {
                path: path,
                mode: '100644',
                type: 'blob',
                sha: blob
              }
            ]
          };
          return _request('POST', "" + this.repoPath + "/git/trees", data).then(function(res) {
            return res.sha;
          }).promise();
        };

        Repository.prototype.postTree = function(tree) {
          var _this = this;
          return _request('POST', "" + this.repoPath + "/git/trees", {
            tree: tree
          }).then(function(res) {
            return res.sha;
          }).promise();
        };

        Repository.prototype.commit = function(parent, tree, message) {
          var data,
            _this = this;
          data = {
            message: message,
            author: {
              name: this.options.username
            },
            parents: [parent],
            tree: tree
          };
          return _request('POST', "" + this.repoPath + "/git/commits", data).then(function(res) {
            _this.currentTree.sha = res.sha;
            return res.sha;
          }).promise();
        };

        Repository.prototype.updateHead = function(head, commit) {
          return _request('PATCH', "" + this.repoPath + "/git/refs/heads/" + head, {
            sha: commit
          });
        };

        Repository.prototype.getInfo = function() {
          return _request('GET', this.repoPath, null);
        };

        Repository.prototype.show = function() {
          return _request('GET', this.repoPath, null);
        };

        Repository.prototype.contents = function(branch, path) {
          return _request('GET', "" + this.repoPath + "/contents?ref=" + branch, {
            path: path
          });
        };

        Repository.prototype.fork = function() {
          return _request('POST', "" + this.repoPath + "/forks", null);
        };

        Repository.prototype.createPullRequest = function(options) {
          return _request('POST', "" + this.repoPath + "/pulls", options);
        };

        Repository.prototype.read = function(branch, path, isBase64) {
          var _this = this;
          return this.getSha(branch, path).then(function(sha) {
            return _this.getBlob(sha, isBase64);
          }).promise();
        };

        Repository.prototype.remove = function(branch, path) {
          var _this = this;
          return this._updateTree(branch).then(function(latestCommit) {
            return _this.getTree("" + latestCommit + "?recursive=true").then(function(tree) {
              var newTree;
              newTree = _.reject(tree, function(ref) {
                return ref.path === path;
              });
              _.each(newTree, function(ref) {
                if (ref.type === 'tree') {
                  return delete ref.sha;
                }
              });
              return _this.postTree(newTree).then(function(rootTree) {
                return _this.commit(latestCommit, rootTree, "Deleted " + path).then(function(commit) {
                  return _this.updateHead(branch, commit).then(function(res) {
                    return res;
                  });
                });
              });
            });
          }).promise();
        };

        Repository.prototype.move = function(branch, path, newPath) {
          var _this = this;
          return this._updateTree(branch).then(function(latestCommit) {
            return _this.getTree("" + latestCommit + "?recursive=true").then(function(tree) {
              _.each(tree, function(ref) {
                if (ref.path === path) {
                  ref.path = newPath;
                }
                if (ref.type === 'tree') {
                  return delete ref.sha;
                }
              });
              return _this.postTree(tree).then(function(rootTree) {
                return _this.commit(latestCommit, rootTree, "Deleted " + path).then(function(commit) {
                  return _this.updateHead(branch, commit).then(function(res) {
                    return res;
                  });
                });
              });
            });
          }).promise();
        };

        Repository.prototype.write = function(branch, path, content, message, isBase64) {
          var _this = this;
          return this._updateTree(branch).then(function(latestCommit) {
            return _this.postBlob(content, isBase64).then(function(blob) {
              return _this.updateTree(latestCommit, path, blob).then(function(tree) {
                return _this.commit(latestCommit, tree, message).then(function(commit) {
                  return _this.updateHead(branch, commit).then(function(res) {
                    return res;
                  });
                });
              });
            });
          }).promise();
        };

        return Repository;

      })();

      Gist = (function() {

        function Gist(options) {
          var id;
          this.options = options;
          id = this.options.id;
          this.gistPath = "/gists/" + id;
        }

        Gist.prototype.read = function() {
          return _request('GET', this.gistPath, null);
        };

        Gist.prototype.create = function(options) {
          return _request('POST', "/gists", options);
        };

        Gist.prototype["delete"] = function() {
          return _request('DELETE', this.gistPath, null);
        };

        Gist.prototype.fork = function() {
          return _request('POST', "" + this.gistPath + "/fork", null);
        };

        Gist.prototype.update = function(options) {
          return _request('PATCH', this.gistPath, options);
        };

        return Gist;

      })();

      Github.prototype.getRepo = function(user, repo) {
        return new Repository({
          user: user,
          name: repo
        });
      };

      Github.prototype.getAuthenticated = function() {
        return new Authenticated();
      };

      Github.prototype.getUser = function(username) {
        return new User(username);
      };

      Github.prototype.getGist = function(id) {
        return new Gist({
          id: id
        });
      };

      return Github;

    })();
    return Github;
  };

  if (typeof exports !== "undefined" && exports !== null) {
    _ = require('underscore');
    jQuery = require('jquery-deferred');
    najax = require('najax');
    jQuery.ajax = najax;
    encode = function(str) {
      var buffer;
      buffer = new Buffer(str, 'binary');
      return buffer.toString('base64');
    };
    Github = makeGithub(_, jQuery, encode, true);
    exports["new"] = function(options) {
      return new Github(options);
    };
  } else if (typeof define !== "undefined" && define !== null) {
    if (this.btoa) {
      define('github', ['underscore', 'jquery'], function(_, jQuery) {
        return makeGithub(_, jQuery, this.btoa);
      });
    } else {
      define('github', ['underscore', 'jquery', 'base64'], function(_, jQuery, Base64) {
        return makeGithub(_, jQuery, Base64.encode);
      });
    }
  } else if (this._ && this.jQuery && (this.btoa || this.Base64)) {
    encode = this.btoa || Base64.encode;
    this.Github = makeGithub(this._, this.jQuery, encode);
  } else {
    err = function(msg) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.error === "function") {
          console.error(msg);
        }
      }
      throw msg;
    };
    if (!this._) {
      err('Underscore not included');
    }
    if (!this.jQuery) {
      err('jQuery not included');
    }
    if (!this.Base64 && !this.btoa) {
      err('Base64 not included');
    }
  }

}).call(this);
