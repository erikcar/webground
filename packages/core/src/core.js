import { Apix } from "./Apix";

export const VERSION = "1.0.0";

export const webground = {
  getCookie : (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
  ),
  lifeCycle: {
    unload: function(f){
      document.addEventListener("visibilitychange", f);
      window.addEventListener("pagehide", f, false);
      document.addEventListener('beforeunload', f);
    },
    load: function(f) {window.addEventListener('onload', f)}
  }
}

//TODO: mutaion MODEL

export const wgmessanger = function(){

}

/**
 * Manager for webObject.
 */
export const wocontext = function(parent){
    this.stored = false,
    this.objects = [],
    this.register = function(wo){
        this.objects.push(wo);
        wo.context = this; // Siamo sicuri??
        if(this.objects.length === 1){
            const instance = this;
            webground.lifeCycle.unload((evt)=>{ //Event wg unload can be call more time on some os architecture, TODO: handle in webground
                if(!instance.stored){
                    instance.save();
                    instance.stored = true;
                }
            });
            //webground.lifeCycle.load(()=>{this.stored = false});
        }   
    };

    this.save = function(){
        for (let k = 0; k < this.objects.length; k++) {
            this.objects[k].save();
        }
    };

    this.requireSync = function(data, all){
        
        const pids = [];

        let wo;
        for (let k = 0; k < this.objects.length; k++) {
            wo = this.objects[k];
            if( (all || wo.syncronize) && !wo.local)
                pids.push(wo.pid);
        }

        data.pids = String(pids); //or join(',');
        
        return pids.length>0;
    };

    this.setData = function(data){
        let wo;
        for (let k = 0; k < this.objects.length; k++) {
            wo = this.objects[k];
            if( data.hasOwnProperty(wo.pid) )
                wo.data = data[wo.pid] || {};
        }
    }

    this.registerAll = function(ar){
        if(ar && ar.length>0){
            let wo, opt;
            for (let i = 0; i < ar.length; i++) {
                wo = ar[i];
                if (wo instanceof webObject) {
                    wo.init(opt[wo.pid]);
                    this.register(wo);
                }
                else
                    opt = wo;
            }
        }
    }

    this.registerAll(arguments);
}

export const donothing = ()=>null;
/**
 * 
 * @param {string} pid string key of object, used to store object.
 * @param {function} decorator 
 * @param {object} option 
 */
function webObject(pid, decorator, option) { 
    this.pid = pid; 
    this.decorator = decorator || donothing; 
    this.option = option || {}; 
    this.data = null; 
    this.store = {save: donothing, getData: donothing};
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
        this.setOption(option);
        this.store = this.option.store || this.store;
        this.data  = this.store.getData(this);
        if(this.data){this.restored = true } else {this.data = {}; this.syncronize = true; }

        if(opt.data){
            for (const key in opt.data) {
                data[key] = opt.data[key];
            }
        }

        //Richiesta precedente al Load Attuale (Es. link a nuova pagina che forza sync)
        if (sessionStorage.getItem("sync_" + this.pid)) {
            this.syncronize = true;
            sessionStorage.removeItem("sync_" + this.pid);
        }

        (this.option.decorator || this.decorator)(this, this.option);

        this.initialized = true;
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
    if(reset)
        this.option = option || {};
    else if(option){
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

webObject.prototype.sync = function (data) {
    //TODO: aggiungere caso local??
    return this.api.call("", data || {pid: this.pid}).then((v)=> {
        if(data) this.context
            ? this.context.setData(v) 
            : this.data = data[this.pid] || {};
        else 
            this.data = v || {};
    });//.catch((e)=> null);
};

webObject.prototype.syncOnLoad = function () {
    sessionStorage.setItem("sync_" + this.pid, "Y")
};

export const localStore = {
    save: function(wobj){
        localStorage.setItem(wobj.pid + '__', JSON.stringify(wobj.data));
    },

    getData: function(wobj){
        return localStorage.getItem(wobj.pid + '__');
    }
};

export const sessionStore = {
    save: function(wobj){
        sessionStorage.setItem(wobj.pid + '__', JSON.stringify(wobj.data));
    },

    getData: function(wobj){
        return sessionStorage.getItem(wobj.pid + '__');
    }
};

export {webObject};