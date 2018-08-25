import Component from '../ts/engine/Component';
import DebugComponent from '../ts/components/DebugComponent';
import GameObject from '../ts/engine/GameObject';
import Scene from '../ts/engine/Scene';

var img = require('./img/speeddriver.png');

let engine = import('../ts/engine/DodoEngine');
engine.then((val) => {
    if (PIXI.utils.TextureCache[img] != null) {
        newGame(val.default);

    } else {
        PIXI.loader.add(img).load(() => newGame(val.default));
    }
}
);


//This `setup` function will run when the image has loaded
function newGame(engine: DodoEngine) {

    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement);

    let texture = PIXI.utils.TextureCache[img];
    let rectangle = new PIXI.Rectangle(2, 163, 169, 134);
    texture.frame = rectangle;

    let roadPixi = new PIXI.Sprite(texture);
    roadPixi.x = 200;
    roadPixi.y = 200;
    roadPixi.scale = new PIXI.Point(2, 2);

    texture = texture.clone();
    rectangle = new PIXI.Rectangle(8, 13, 39, 106);
    texture.frame = rectangle;

    let carPixi = new PIXI.Sprite(texture);
    carPixi.anchor.x = 0.5;
    carPixi.anchor.y = 0.5;

    let road = new GameObject("road", 0, roadPixi);
    road.addComponent(new RotationAnim());
    engine.scene.addGlobalGameObject(road);

    let car = new GameObject("car", 0, carPixi);
    road.addGameObject(car);
}

class RotationAnim extends Component {
    update(delta, absolute) {
        this.owner.mesh.rotation += delta;
    }
}