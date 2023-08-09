import { Apix } from "./Apix";

export const VERSION = "1.0.0";

export const webground = {
    getCookie: (name) => (
        document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || null
    ),
    lifeCycle: {
        unload: function (f) {
            document.addEventListener("visibilitychange", f);
            window.addEventListener("pagehide", f, false);
            document.addEventListener('beforeunload', f);
        },
        load: function (f) { window.addEventListener('onload', f) }
    }
}

//TODO: mutaion MODEL

export const wgmessanger = function () {

}

/**
 * Manager for webObject.
 */
export const wocontext = function (parent) {
    this.stored = false,
        this.objects = [],
        this.register = function (wo) {
            this.objects.push(wo);
            wo.context = this; // Siamo sicuri??
            if (this.objects.length === 1) {
                const instance = this;
                webground.lifeCycle.unload((evt) => { //Event wg unload can be call more time on some os architecture, TODO: handle in webground
                    if (!instance.stored) {
                        instance.save();
                        instance.stored = true;
                    }
                });
                //webground.lifeCycle.load(()=>{this.stored = false});
            }
        };

    this.save = function () {
        for (let k = 0; k < this.objects.length; k++) {
            this.objects[k].save();
        }
    };

    this.requireSync = function (data, all) {

        const pids = [];

        let wo;
        for (let k = 0; k < this.objects.length; k++) {
            wo = this.objects[k];
            if ((all || wo.syncronize) && !wo.local)
                pids.push(wo.pid);
        }

        data.pids = String(pids); //or join(',');

        return pids.length > 0;
    };

    this.sync = function (data) {
        //TODO: aggiungere caso local??
        return this.api.call("wo_sync", data).then((v) => {
            this.setData(v)
        });
    };

    this.setData = function (data) {
        let wo;
        for (let k = 0; k < this.objects.length; k++) {
            wo = this.objects[k];
            if (data.hasOwnProperty(wo.pid))
                wo.data = data[wo.pid] || {};
        }
    }

    this.registerAll = function (ar) {
        if (ar && ar.length > 0) {
            let wo, opt;
            for (let i = 0; i < ar.length; i++) {
                wo = ar[i];
                if (wo instanceof webObject) {
                    if (!wo.initialized)
                        wo.init(opt && opt[wo.pid]);
                    this.register(wo);
                }
                else
                    opt = wo;
            }
        }
    }

    this.registerAll(arguments);
}

export const donothing = () => null;
/**
 * 
 * @param {string} pid string key of object, used to store object.
 * @param {Decorator} decorator 
 * @param {object} option 
 */
function webObject(pid, decorator, option) {
    this.pid = pid;
    this.decorator = decorator || donothing;
    this.option = option || {};
    this.data = null;
    this.store = { save: donothing, getData: donothing };
    this.initialized = false;
    this.local = false;
    this.syncronize = false;
}

/**
 * 
 * @param {object} option 
 * @returns 
 */
// Creo meccaniscmo di controllo che non ci siano obj con stesso ID?
webObject.prototype.init = function (option) {
    if (!this.initialized) {
        console.log("init")
        this.setOption(option);
        this.store = this.option.store || this.store;
        this.data = this.store.getData(this);
        console.log("RESTORED DATA", this.data);
        if (this.data) { this.restored = true } else { this.data = {}; this.syncronize = true; }

        //Anche se è restored?
        if (this.option.data) {
            for (const key in this.option.data) {
                this.data[key] = this.option.data[key];
            }
        }

        console.log("sync")
        //Richiesta precedente al Load Attuale (Es. link a nuova pagina che forza sync)
        if (sessionStorage.getItem("sync_" + this.pid)) {
            this.syncronize = true;
            sessionStorage.removeItem("sync_" + this.pid);
        }

        this.initialized = true;

        (this.option.decorator || this.decorator)(this, this.option);

        //delete this.option && this.decorator ???
        delete this.decorator;
    }

    return this.data;
};

webObject.prototype.toJSON = function () {
    return JSON.stringify(this.data);
};

webObject.prototype.setField = function (name, value) {
    this.data[name] = value;
    this.save();
};

webObject.prototype.setOption = function (option, reset) {
    if (reset)
        this.option = option || {};
    else if (option) {
        for (const key in option) {
            if (Object.hasOwnProperty.call(option, key)) {
                this.option[key] = option[key];
            }
        }
    }
};

webObject.prototype.save = function () {
    this.store.save(this);
};

webObject.prototype.api = Apix;
/**
 * Syncronize object data with remote source
 * @param {*} data 
 * @returns 
 */
webObject.prototype.sync = function () {
    //TODO: aggiungere caso local??
    return this.api.call("wo_sync", { pid: this.pid }).then((v) => {
        this.data = v || {};//v[this.pid]
    });
};

webObject.prototype.syncOnNextLoad = function () {
    sessionStorage.setItem("sync_" + this.pid, "Y")
};

//Trasformare in Promise?
export const localStore = {
    save: function (wobj) {
        localStorage.setItem(wobj.pid + '__', JSON.stringify(wobj.data));
    },

    getData: function (wobj) {
        return JSON.parse(localStorage.getItem(wobj.pid + '__'));
    }
};

export const sessionStore = {
    save: function (wobj) {
        sessionStorage.setItem(wobj.pid + '__', JSON.stringify(wobj.data));
    },

    getData: function (wobj) {
        return JSON.parse(sessionStorage.getItem(wobj.pid + '__'));
    }
};

export function deferredAction(action, offset) {
    if (!action) throw new Error("deferredAction must define action on constructor.")
    this.waiting = false;
    this.offset = offset || 500;
    this.timer = null;
    this.execute = function () {
        if (!this.waiting) {
            this.waiting = setTimeout((() => {
                this.waiting = false;
                action();
            }).bind(this), this.offset);
        }
    }

    this.setOffset = function (value) {
        this.offset = value;
        this.execute();
        /*if(this.waiting){
            clearTimeout(this.waiting);
            this.waiting = false;  
        }*/
    }
}

export function waitAction(action, wait) {

    this.time = null;
    this.action = action;
    const instance = this;

    this.deferred = new deferredAction(() => {
        const noaction = new Date().getTime() - instance.time.getTime();

        const w = (wait || 500);
        console.log("NO ACTION", noaction, w, w - (w * 2 / 10));
        noaction > w - (w * 2 / 10)
            ? instance.action()
            : instance.deferred.setOffset(w - noaction);
    }, wait || 500);

    this.execute = function () {
        this.time = new Date();
        this.deferred.execute();
    }

    this.executeNow = function () {
        this.action();
    }
}


function onTheFly() {
    this.procedures = {};

    this.define = function (name, f) {
        this.procedures[name] = f;
    }

    this.walkTheDOM = function (node, func) {
        func(node);
        node = node.firstChild;
        while (node && (!node.hasAttribute || !node.hasAttribute("data-foreach"))) {
            this.walkTheDOM(node, func);
            node = node.nextSibling;
        }
    }

    this.fill = function (obj, container) {
        console.log("object", obj);
        container = document.getElementById(container) || document;
        let fields = container.querySelectorAll("[data-content], [data-func]");
        let field;
        let v;
        let p;
        for (var i = 0; i < fields.length; i++) {
            field = fields[i];
            if (field.hasAttribute("data-content")) {
                v = field.getAttribute("data-content");
                p = v.split(',');
                v = "";
                for (var j = 0; j < p.length; j++) {
                    console.log("value", v, field.getAttribute("data-content"));
                    v += obj[p[j]] + " ";
                }
                v.trim();
                if (field.tagName === "input")
                    field.value = v;
                else {
                    field.innerText = v;
                }
            }
            if (field.hasAttribute("data-func")) {
                v = field.getAttribute("data-func");
                p = v.split('-');

                this.procedures[p[0]].apply(null, [obj[p[1]], field, obj].concat(p.slice(1)));

            }
        }

        let f = container.querySelectorAll("[data-func]");
    }

    this.forEach = function (container, values, info) {
        if (!container) { return; }
        else if (isString(container)) { container = document.getElementById(container); }
        let item = container.querySelector("[data-template]")
        container.removeChild(item);
        if (!Array.isArray(values)) {
            values = [values];
        }

        let nodes = {};
        let datas = {};
        let c = 0;
        this.walkTheDOM(item, function (node) {
            //console.log("NODE", node, node.nodeType);
            if (node.attributes) {
                var attrs = node.attributes;
                let value;
                let index;
                let jndex;
                for (var i = attrs.length - 1; i >= 0; i--) {
                    if (!attrs[i].value) continue;
                    value = attrs[i].value;
                    if (attrs[i].name === "data-func") {
                        nodes[c] = { e: attrs[i], v: value, k: node };
                        c++;
                        continue;
                    }
                    index = value.indexOf('[');
                    if (index < 0) continue;
                    nodes[c] = { e: attrs[i], v: value, k: [] };
                    while (index > -1 && c < 10) {
                        jndex = value.indexOf(']', index);
                        nodes[c].k.push(value.substr(index, jndex - index + 1));
                        index = value.indexOf('[', jndex);
                        //console.log("index", value.substr(index, jndex - index), index, jndex, attrs[i]);
                    }
                    c++;
                }
            }
            if (node.nodeType === 3) { // Is it a Text node?
                value = node.data.trim();
                index = value.indexOf('[');
                if (index < 0) return;
                nodes[c] = { e: node, v: value, k: [] };
                while (index > -1) {
                    jndex = value.indexOf(']', index);
                    nodes[c].k.push(value.substr(index, jndex - index + 1));
                    index = value.indexOf('[', jndex)
                }
                c++;
            }
        });

        const setValues = (j) => {
            let value;
            let k;
            let v;
            let e;
            for (var key in nodes) {
                k = nodes[key].k;
                v = nodes[key].v;
                e = nodes[key].e;
                if (e.name === "data-func") {
                    this.procedures[e.value](values[j], k, j, info)
                }
                else {
                    for (var z = 0; z < k.length; z++) {
                        //console.log("key", k[z], k[z].substr(2, k[z].length - 3), k[z].substr(1, k[z].length - 2), values[j][k[z].substr(2, k[z].length - 3)]);
                        if (k[z][1] === '$') {
                            v = j;
                            continue;
                        }

                        k[z][1] === '#' ? value = this.procedures[k[z].substr(1, k[z].length - 2)](values[j][k[z].substr(2, k[z].length - 3)], values[j], nodes[key], j, info) : value = values[j][k[z].substr(1, k[z].length - 2)];
                        v = v.replace(k[z], value);
                    }

                    //console.log("VALUE", value);

                    if (v === "null")
                        v = "";

                    if (e.nodeType === 3)
                        e.data = v;
                    else
                        e.value = v;
                }
            }
        }

        let sub = item.querySelectorAll("[data-foreach]");
        let list = [];
        for (let i = 0; i < values.length; i++) {
            setValues(i)
            for (var k = 0; k < sub.length; k++) {
                let el = sub[k]
                this.forEach(el, values[i][el], { index: i, item: values[i] })
            }
            //console.log("ITEM", item)
            container.appendChild(item.cloneNode(true));
            //list.push(item.cloneNode(true));
        }
        //container.append(list);
        //return container;
    }
}

export { webObject };