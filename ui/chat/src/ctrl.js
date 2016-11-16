var redraw = require('mithril/redraw').publish;
var prop = require("mithril/stream")
var makeModeration = require('./moderation').ctrl;
var makeNote = require('./note').ctrl;
var makePreset = require('./preset').ctrl;

module.exports = function(opts) {

  var data = opts.data;

  var vm = {
    enabled: prop(!lichess.storage.get('nochat')),
    writeable: prop(opts.writeable),
    isTroll: opts.kobold,
    isMod: opts.permissions.timeout,
    isTimeout: prop(opts.timeout),
    parseMoves: opts.parseMoves,
    placeholderKey: 'talkInChat',
    moderating: prop(null),
    tab: prop('discussion'),
    loading: prop(false)
  };

  var post = function(text) {
    text = $.trim(text);
    if (!text) return false;
    if (text.length > 140) {
      alert('Max length: 140 chars. ' + text.length + ' chars used.');
      return false;
    }
    lichess.pubsub.emit('socket.send')('talk', text);
    return false;
  };

  var onTimeout = function(username) {
    data.lines.forEach(function(l) {
      if (l.u === username) l.d = true;
    });
    if (username.toLowerCase() === data.userId) vm.isTimeout(true);
    redraw();
  };

  var onReinstate = function(userId) {
    if (userId === data.userId) {
      vm.isTimeout(false);
      redraw();
    }
  };

  var onMessage = function(line) {
    if (data.lines.length > 64) data.lines.shift();
    data.lines.push(line);
    redraw();
  };

  var trans = lichess.trans(opts.i18n);

  var moderation = vm.isMod ? makeModeration({
    reasons: opts.timeoutReasons,
    permissions: opts.permissions,
    send: lichess.pubsub.emit('socket.send')
  }) : null;

  var note = data.userId && opts.noteId ? makeNote({
    id: opts.noteId,
    trans: trans
  }) : null;

  var preset = makePreset({
    initialGroup: opts.preset,
    post: post
  });

  var setWriteable = function(v) {
    vm.writeable(v);
    redraw();
  };

  lichess.pubsub.on('socket.in.message', onMessage);
  lichess.pubsub.on('socket.in.chat_timeout', onTimeout);
  lichess.pubsub.on('socket.in.chat_reinstate', onReinstate);
  lichess.pubsub.on('chat.writeable', setWriteable);

  return {
    data: data,
    vm: vm,
    moderation: moderation,
    note: note,
    preset: preset,
    post: post,
    trans: trans,
    setEnabled: function(v) {
      vm.enabled(v);
      if (!v) lichess.storage.set('nochat', 1);
      else lichess.storage.remove('nochat');
      console.log(vm.enabled());
    }
  };
};
