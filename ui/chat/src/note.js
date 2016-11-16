var m = require('mithril/hyperscript');
var prop = require("mithril/stream")
var trust = require('mithril/render/trust');
var redraw = require('mithril/redraw').publish;
var xhr = require('./xhr');

module.exports = {
  ctrl: function(opts) {
    var id = opts.id;
    var vm = {
      text: prop(null)
    };
    var doPost = $.fp.debounce(function() {
      xhr.setNote(id, vm.text());
    }, 1000);
    return {
      id: id,
      vm: vm,
      trans: opts.trans,
      fetch: function() {
        xhr.getNote(id).then(function(t) {
          vm.text(t || '');
          redraw();
        });
      },
      post: function(text) {
        vm.text(text);
        doPost();
      }
    }
  },
  view: function(ctrl) {
    var text = ctrl.vm.text();
    if (text === null) return m('div.loading', {
      oncreate: function(vnode) {
        ctrl.fetch();
      }
    }, trust(lichess.spinnerHtml));
    return m('textarea', {
      placeholder: ctrl.trans('typePrivateNotesHere'),
      oncreate: function(vnode) {
        $(vnode.dom).val(text).on('change keyup paste', function() {
          ctrl.post($(vnode.dom).val());
        });
      }
    });
  }
};
