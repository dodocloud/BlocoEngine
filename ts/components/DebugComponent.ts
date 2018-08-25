import Component from '../engine/Component';
import {MSG_OBJECT_ADDED, MSG_OBJECT_REMOVED, MSG_ALL,
    STATE_DRAWABLE, STATE_INACTIVE, STATE_LISTENING, STATE_UPDATABLE} from '../engine/Constants';

// Debugging component that renders the whole scene graph
class DebugComponent extends Component {
    targetHtmlElement : HTMLElement = null;
    strWrapper: any = null;

    constructor(displayBBox, targetHtmlElement) {
        super();
        this.targetHtmlElement = targetHtmlElement; // TODO add something more generic here
        this.strWrapper = {
            str: ""
        };
    }

    oninit() {
        if (this.owner.parent != null) {
            throw new Error("DebugComponent must be attached to the very root!");
        }

        // subscribe to all messages
        this.subscribe(MSG_ALL);
    }

    onmessage(msg) {
        let ownerTag = msg.gameObject != null ? msg.gameObject.tag : "";
        if (typeof (msg.action) == "string") {
            console.log(msg.action + " >> " + ownerTag);
        }
    }

    update(delta, absolute) {
        this.strWrapper.str = "";
        this._processNode(this.owner, this.strWrapper);
        this.targetHtmlElement.innerHTML = this.strWrapper.str;
    }


    _drawBoundingBox(ctx, node) {
        if (node.hasState(STATE_DRAWABLE)) {
            let bb = node.bbox;
            let posX = bb.topLeftX * this.scene.unitSize;
            let posY = bb.topLeftY * this.scene.unitSize;
            let size = bb.getSize();

            if (size.width != 0 && size.height != 0) {
                ctx.rect(posX, posY, size.width * this.scene.unitSize, size.height * this.scene.unitSize);
            }

            ctx.rect(node.trans.absPosX * this.scene.unitSize, node.trans.absPosY * this.scene.unitSize, 10, 10);
        }
        for (let [id, child] of node.children) {
            this._drawBoundingBox(ctx, child);
        }
    }

    _setPadding(padding) {
        let otp = "";
        for (let i = 0; i < padding; i++) {
            otp = otp.concat("&nbsp");
        }
        return otp;
    }

    _processNode(node, strWrapper, padding = 0) {

        // transform:
        strWrapper.str += "<strong><span style=\"color:red\">";
        strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) +
            `rel:[${node.trans.posX.toFixed(2)},${node.trans.posY.toFixed(2)}]|abs:[${node.trans.absPosX.toFixed(2)},${node.trans.absPosY.toFixed(2)}]|rot: ${node.trans.rotation.toFixed(2)}|z: ${node.zIndex}` +
            "<br>");
        strWrapper.str += "</span></strong>";

        // mesh
        strWrapper.str += "<strong><span style=\"color:purple\">";
        strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) +
            `size:[${node.mesh.width.toFixed(2)} x ${node.mesh.height.toFixed(2)}]` +
            "<br>");
        strWrapper.str += "</span></strong>";

        // attributes
        for (let [key, attr] of node.attributes) {
            strWrapper.str += "<strong><span style=\"color:red\">";
            strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) +
                `${key} => ${attr.toString()}` +
                "<br>");
            strWrapper.str += "</span></strong>";
        }

        // components
        for (let cmp of node.components) {
            strWrapper.str += "<span style=\"color:blue\">";
            strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) + cmp.constructor.name + "<br>");
            strWrapper.str += "</span>";
        }

        // children
        for (let [id, child] of node.children) {
            strWrapper.str += "<span style=\"color:green\">";
            strWrapper.str = strWrapper.str.concat(this._setPadding(padding) +
                `${child.id}:${child.tag}` + "<br>");
            this._processNode(child, strWrapper, padding + 4);
            strWrapper.str += "</span>";
        }
    }
}