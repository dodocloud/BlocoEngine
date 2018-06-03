function runTests() {

    // unit size is 100 px!
    UNIT_SIZE = 100;
    // init component microengine
    let canvas = document.getElementById('gameCanvas');
    var scene = new Scene(canvas);


    let rect1 = new GameObject("rect1");
    rect1.mesh = new RectMesh("rgb(255,0,0)", 1, 1); // 100x100 pixels
    rect1.trans.setPosition(2, 2);
    rect1.trans.rotationOffsetX = 0.5;
    rect1.trans.rotationOffsetY = 0.5;
    rect1.addComponent(new BasicRenderer());
    rect1.addComponent(new RotationAnim());
    scene.addGlobalGameObject(rect1);

    let rect2 = new GameObject("rect2");
    rect2.mesh = new RectMesh("rgb(0,255,0)", 1, 1); // 100x100 pixels
    rect2.trans.setPosition(3.5, 2);
    rect2.trans.rotationOffsetX = 0.5;
    rect2.trans.rotationOffsetY = 0.5;
    rect2.addComponent(new BasicRenderer());
    rect2.addComponent(new RotationAnim());
    scene.addGlobalGameObject(rect2);

    let rot = new RotationAnim();

    tests({
        'Executor test': function () {
            scene.clearScene();
           
            let rot = new RotationAnim();
            let rect1 = new GameObject("rect1");
            rect1.mesh = new RectMesh("rgb(255,0,0)", 1, 1); // 100x100 pixels
            rect1.trans.setPosition(2, 2);
            rect1.trans.rotationOffsetX = 0.5;
            rect1.trans.rotationOffsetY = 0.5;
            rect1.addComponent(new BasicRenderer());
            rect1.addComponent(new RotationAnim());
            scene.addGlobalGameObject(rect1);

            let executor = new ExecutorComponent()
            .waitTime(3) // execute with a delay				
            .beginIf(() => true)
            .execute(() => console.log("1"))
            .beginIf(() => false)
            .execute(() => console.log("!!!!! 1 BUG"))
            .endIf()
            .beginIf(() => false)
            .execute(() => console.log("!!!!! 2 BUG"))
            .beginIf(() => false)
            .execute(() => console.log("!!!!! 3 BUG"))
            .else()
            .execute(() => console.log("!!!!! 4 BUG"))
            .endIf()
            .else()
            .execute(() => console.log("2"))
            .beginRepeat(2)
            .beginRepeat(3)
            .execute((cmp) => console.log("REP " + cmp.helpParam))
            .endRepeat()
            .endRepeat()
            .endIf()
            .else()
            .execute(() => console.log("!!!!! 5 BUG"))
            .endIf()
            .beginRepeat(2)
            .execute(() => {
                console.log("REP SEC");
            })
            .endRepeat()
            .beginWhile(() => Math.random() > 0.9)
            .execute(() => {
                console.log("WHILE")
            })
            .endWhile()
            //	.beginInterval(2)
            //	.execute(() => { console.log("interval")})
            //	.endInterval()	
            .addComponent(rect2, rot)
            .waitTime(2)
            .execute(() => rot.finish())
            .waitForFinish(rot)
            .waitUntil(() => {
                return Math.random() > 0.9;
            })
            .waitFrames(10)
            .execute((cmp) => cmp.scene.addPendingInvocation(2, () => cmp.sendmsg("MOJO")))
            .waitForMessage("MOJO")
            .execute(cmp => {
                cmp.finish();
            });


            rect1.addComponent(executor);

            let counter = 0;
            while(!executor.isFinished){
                scene.update(0.1, counter);
                counter+=0.1;
            }
        }
    });
}

class RotationAnim extends Component {
    oninit() {
        this.subscribe("STOP");
    }

    onmessage(msg) {
        if (msg.action == "STOP") {
            this.finish();
        }
    }

    update(delta, absolute) {
        this.owner.trans.rotation += delta;
    }
}

class MovingAnim extends Component {
    oninit() {
        this.initPosX = this.owner.trans.posX;
        this.initPosY = this.owner.trans.posY;
        this.radius = 1;
        this.subscribe("STOP");
    }

    onmessage(msg) {
        if (msg.action == "STOP") {
            this.finish();
        }
    }

    update(delta, absolute) {
        this.owner.trans.setPosition(this.initPosX + this.radius * Math.cos(absolute),
            this.initPosY + this.radius * Math.sin(absolute));
    }
}