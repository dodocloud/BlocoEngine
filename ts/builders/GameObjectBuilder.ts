class GameObjectBuilder {
    gameObj: GameObject = null;
    isGlobal = false;
    parent: GameObject = null;

	constructor(name: string) {
		this.gameObj = new GameObject(name);
	}

	withSecondaryId(id : number) {
		this.gameObj.secondaryId = id;
		return this;
	}

	withComponent(cmp : Component) {
		this.gameObj.addComponent(cmp);
		return this;
	}

	withAttribute(key : string, attr : any) {
		this.gameObj.addAttribute(key, attr);
		return this;
	}

	withParent(parent : GameObject) {
		this.parent = parent;
		return this;
	}

	withPosition(posX: number, posY: number) {
        this.gameObj.mesh.position.x = posX;
        this.gameObj.mesh.position.y = posY;
		return this;
	}

	withRotation(rot, offsetX = 0, offsetY = 0) {
        this.gameObj.mesh.rotation = rot;
        this.gameObj.mesh.pivot.x = offsetX;
        this.gameObj.mesh.pivot.y = offsetY;
		return this;
	}

	withMesh(mesh : PIXI.Container) {
		this.gameObj.mesh = mesh;
		return this;
    }

	asGlobal() {
		this.isGlobal = true;
		return this;
	}

	build(scene) {
		if (this.isGlobal || this.parent == null) {
			scene.addGlobalGameObject(this.gameObj);
		} else {
			this.parent.addGameObject(this.gameObj);
		}

		return this.gameObj;
	}
}