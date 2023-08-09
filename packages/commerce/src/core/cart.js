//import { webObject } from "@webground/core/dist/webground.js"

//import { webObject } from "../../../core/dist";

import { webObject, localStore, session } from "@webground/core";

export const cart_default_decorator = (instance, option) => {
    const data = instance.data;

    if (!instance.restored) {
        data.items = {};
        data.booking = 0;
        data.total = 0;
        data.count = 0;
    }
}

export const cart = new webObject("cart", cart_default_decorator, { store: localStore });

cart.update = function (info, qta) {
    const instance = this;
    const data = this.data;
    qta = qta || 1;

    if(!info.hasOwnProperty("qta"))
        info.qta = 0;

    qta += info.qta

    if (!data.items.hasOwnProperty(info.id)) {
        if (qta > 0) {
            this.api.call("cart_add", { id: id, qta: qta }).then(() => {
                info.qta = qta;
                data.items[id] = true;
                data.total += qta * info.price;
                data.count++;
                info.booking && data.booking++;
                instance.session.publish("CART_ADD", data, info);
            });
        }
        else {
            //Log Bug (Solo in dev?)
        }
    }
    else if(qta > 0) {
            this.api.call("cart_update", { id: id, qta: qta}).then(() => {
                info.qta = qta;
                data.total += qta * item.price;
                instance.session.publish("CART_UPDATE", data, info);
            })
    }
    else{
        this.remove(info);
    }
}

cart.remove = function (info) {
    const data = this.data;
    const instance = this;
    if (data.items.hasOwnProperty(info.id)) {
        this.api.call("cart_remove", { id: info.id }).then(() => {
            delete data.items[id];
            data.total -= info.qta * info.price;
            data.count--;
            info.booking && data.booking--;
            info.qta = 0;
            instance.session.publish("CART_REMOVE", data, info);
        });
    }
    else {
        //Log Bug
    }
}

cart.clear = function () {
    const data = this.data;
    const instance = this;
    this.api.call("cart_clear").then(() => {
        data.items = {};
        data.booking = 0;
        data.total = 0;
        data.count = 0;
        instance.session.publish("CART_CLEAR", data);
    });
};