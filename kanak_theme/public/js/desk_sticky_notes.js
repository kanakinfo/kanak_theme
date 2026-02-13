/*
Desk Sticky Notes Overlay
- Loads notes for current user
- Movable, resizable sticky cards using jQuery UI
- Improved UI: colors, shadows, bold/italic, smooth edges
- Create new notes, edit inline, delete, pin, hide/show all
- Persists via Frappe API
*/

(function () {
  if (window.__sticky_notes_loaded) return;
  window.__sticky_notes_loaded = true;

  // ----- CSS -----
  const css = `
  /* Overlay */
  .sn-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 100000; }
  
  /* Note card */
  .sn-note {
    position: absolute;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    border-radius: 8px;
    overflow: hidden;
    pointer-events: auto;
    font-family: 'Arial', sans-serif;
    transition: box-shadow 0.2s ease;
  }
  .sn-note.sn-dragging { box-shadow: 0 12px 32px rgba(0,0,0,0.35); }

  /* Header */
  .sn-note .sn-header {
    padding: 6px 10px;
    cursor: move;
    font-weight: bold;
    font-style: italic;
    display: flex;
    gap: 8px;
    align-items: center;
    background: rgba(0,0,0,0.05);
    border-bottom: 1px solid rgba(0,0,0,0.1);
  }

  /* Title text */
  .sn-note .sn-title { flex: 1; word-break: break-word; }

  /* Body */
  .sn-note .sn-body {
    padding: 8px;
    min-height: 50px;
    max-height: 400px;
    overflow-y: auto;
    resize: none;
    background: rgba(255,255,255,0.9);
    font-style: italic;
  }

  /* Controls */
  .sn-note .sn-controls {
    margin-left:auto;
    display:flex;
    gap:6px;
    align-items:center;
  }
  .sn-btn {
    border:none;
    background:transparent;
    cursor:pointer;
    padding:4px;
    font-size:14px;
    transition: transform 0.1s ease;
  }
  .sn-btn:hover { transform: scale(1.2); }
  /* Resize handle */
  .sn-resize-handle {
    position:absolute;
    right:6px;
    bottom:6px;
    width:16px;
    height:16px;
    cursor: se-resize;
    opacity:0.6;
  }
    .sn-body:focus {
        outline: none; /* blue outline */
        outline-offset: -2px;        /* optional: makes outline inside the box */
        box-shadow: 0 0 6px rgba(30,144,255,0.6); /* subtle glow effect */
    }
    .sn-note.editing {
        box-shadow: 0 8px 20px rgba(30,144,255,0.4);
    }
    .sn-fab {
  position: fixed;
  right: 12px;
  bottom: 20px;
  z-index: 100001;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.18);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 42px;
  transition: width 0.25s ease;
  overflow: hidden;
}

.sn-fab:hover {
  width: 180px;
}

/* Button */
.sn-fab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  cursor: pointer;
  border: none;
  background: transparent;
  white-space: nowrap;
  font-size: 14px;
  transition: background 0.2s ease;
}

.sn-fab-btn:hover {
  background: rgba(0,0,0,0.05);
}

.sn-fab-icon {
  font-size: 18px;
  width: 22px;
  text-align: center;
}

.sn-fab-label {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sn-fab:hover .sn-fab-label {
  opacity: 1;
}
  `;
  // const style = document.createElement('style');
  // style.innerHTML = css;
  // document.head.appendChild(style);

  // ----- Overlay -----
  const overlay = document.createElement('div');
  overlay.className = 'sn-overlay';
  document.body.appendChild(overlay);

  // ----- Toolbar -----
  const fab = document.createElement('div');
    fab.className = 'sn-fab';
    fab.innerHTML = `
      <button class="sn-fab-btn" id="sn-fab-toggle">
        <span class="sn-fab-icon">👁</span>
        <span class="sn-fab-label">Hide / Show Notes</span>
      </button>

      <button class="sn-fab-btn" id="sn-fab-new">
        <span class="sn-fab-icon">➕</span>
        <span class="sn-fab-label">New Sticky Note</span>
      </button>
    `;
    document.body.appendChild(fab);


  let notes = [];
  let zCounter = 1000;

  // ----- API -----
  function api(method, args) {
    return new Promise((resolve, reject) => {
      frappe.call({
        method: `kanak_theme.kanak_theme.api.api.${method}`,
        args: args,
        callback: r => resolve(r.message),
        error: e => reject(e)
      });
    });
  }

  // ----- Utility -----
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // ----- Render notes -----
  function render() {
    overlay.innerHTML = '';
    notes.forEach(n => {
      if (!n.visible) return;

      // Create node
      const node = el('div','sn-note');
      node.style.left = (n.x||0)+'px';
      node.style.top = (n.y||0)+'px';
      node.style.width = (n.width||250)+'px';
      node.style.height = (n.height||200)+'px';
      node.style.background = n.color || '#fff380';
      node.style.zIndex = (n.z_index||zCounter)+'';
      node.dataset.name = n.name;

      // Header
      const header = el('div','sn-header');
      header.innerHTML = `<span class="sn-title">${(n.title||'')}</span>`;
      const controls = el('div','sn-controls');
      controls.innerHTML = `
        <button class="sn-btn sn-pin" title="Pin">${n.pinned?'📌':'📍'}</button>
        <button class="sn-btn sn-hide" title="Hide">👁️</button>
        <button class="sn-btn sn-delete" title="Delete">🗑️</button>
      `;
      header.appendChild(controls);
      node.appendChild(header);

      // Body
      const body = el('div','sn-body');
      body.contentEditable = true;
      body.innerText = n.content||'';
      node.appendChild(body);

      overlay.appendChild(node);
      const headerHeight = header.offsetHeight;
      body.style.height = (n.height - headerHeight - 0) + 'px';

      // ----- jQuery UI draggable + resizable -----
      $(node).draggable({
        handle: ".sn-header",
        containment: "window",
        cancel: ".sn-body, input, textarea, .sn-controls",
        start: function () {
          zCounter++;
          $(this).css("z-index", zCounter);
        },
        stop: function (e, ui) {
          n.x = ui.position.left;
          n.y = ui.position.top;
          api('update_note', { name: n.name, x: n.x, y: n.y }).catch(()=>{});
        }
      });

      $(node).resizable({
          handles: "se",
          minWidth: 180,
          minHeight: 120,
          stop: function(e, ui){
              n.width = ui.size.width;
              n.height = ui.size.height;
              api('update_note', { name: n.name, width: n.width, height: n.height }).catch(()=>{});

              // Adjust body height to fill note
              const headerHeight = $(node).find('.sn-header').outerHeight();
              const body = $(node).find('.sn-body');
              body.height(n.height - headerHeight - 12); // 12 = padding bottom
          }
      });

      // ----- Body save debounce -----
      let saveTimer = null;
      body.addEventListener('input', () => {
        n.content = body.innerText;
        if(saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          api('update_note', { name: n.name, content: n.content }).catch(()=>{});
        },700);
      });

      // ----- Title edit -----
      header.querySelector('.sn-title').addEventListener('dblclick', (ev) => {
        const tspan = ev.target;
        const old = tspan.innerText || '';
        const input = document.createElement('input');
        input.type = 'text'; input.value = old;
        input.style.fontWeight='600'; input.style.fontStyle='italic';
        tspan.replaceWith(input);
        input.focus();
        input.addEventListener('blur', () => {
          n.title = input.value;
          api('update_note',{name:n.name,title:n.title}).catch(()=>{});
          input.replaceWith(tspan);
          tspan.innerText = n.title;
        });
        input.addEventListener('keydown', e=>{ if(e.key==='Enter') input.blur(); });
      });

      // ----- Buttons -----
      controls.querySelector('.sn-delete').addEventListener('click', () => {
      frappe.confirm(
        __('Delete this note?'),
        () => {
          // YES
          api('delete_note', { name: n.name })
            .then(() => {
              notes = notes.filter(x => x.name !== n.name);
              render();
            })
            .catch(() => {
              frappe.msgprint(__('Delete failed'));
            });
        },
        () => {
        }
      );
    });

      controls.querySelector('.sn-hide').addEventListener('click',()=>{
        n.visible = 0;
        api('update_note',{name:n.name,visible:0}).then(()=>render()).catch(()=>{});
      });
      controls.querySelector('.sn-pin').addEventListener('click',()=>{
        n.pinned = n.pinned ? 0:1;
        api('update_note',{name:n.name,pinned:n.pinned}).then(()=>render()).catch(()=>{});
      });

    });
  }

  // ----- Load notes from backend -----
  async function load() {
    const r = await api('list_notes');
    if(Array.isArray(r)){
      notes = r.map(n=>{
        n.x = parseFloat(n.x)||0;
        n.y = parseFloat(n.y)||0;
        n.width = parseFloat(n.width)||250;
        n.height = parseFloat(n.height)||200;
        n.z_index = parseInt(n.z_index)||0;
        n.visible = n.visible ? 1:0;
        n.color = n.color || getRandomColor();
        return n;
      });
      render();
    }
  }

  // ----- Toolbar actions -----
  document.getElementById('sn-fab-new').addEventListener('click', () => {
  const d = new frappe.ui.Dialog({
    title: 'Create Sticky Note',
    fields: [
      {
        fieldname: 'title',
        fieldtype: 'Data',
        label: 'Title',
        reqd: 1,
        default: 'New Note'
      }
    ],
    primary_action_label: 'Create',
    primary_action: async (values) => {
      d.hide();

      const color = getRandomColor();
      const res = await api('create_note', {
        title: values.title || '',
        content: '',
        x: 50,
        y: 50,
        color: color
      });

      if (res) {
        notes.push(res);
        render();
      } else {
        frappe.msgprint('Error creating note');
      }
    }
  });

  d.show();
});


  let allHidden = false;
  document.getElementById('sn-fab-toggle').addEventListener('click', async () => {
    allHidden = !allHidden;

    for (let n of notes) {
      n.visible = allHidden ? 0 : 1;
      await api('update_note', {
        name: n.name,
        visible: n.visible
      });
    }

    render();
  });


  // ----- Initial load -----
  load();

  // Refresh on Frappe events
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) load();});

  // ----- Helpers -----
  function getRandomColor(){
    const colors = ['#fff380','#ffd0d0','#c0ffd8','#c0d0ff','#ffe0a0','#d0ffe0'];
    return colors[Math.floor(Math.random()*colors.length)];
  }

  // ----- Debug -----
  window.__sticky_notes = { reload: load, notes: notes };

})();
