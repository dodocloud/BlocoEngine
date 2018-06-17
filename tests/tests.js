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
        'Executor execute': function () {
            scene.clearScene();
            let obj = new GameObject("testObject");
            scene.addGlobalGameObject(obj);
            let param = 0;

            let executor = new ExecutorComponent()
                .execute(() => param = 1)
                .execute(() => assert(param == 1, "Wrong parameter value"));

            obj.addComponent(executor);

            let counter = 0;
            while (!executor.isFinished) { // simulate game loop
                scene.update(0.1, counter);
                counter += 0.1;
            }
        },
        'Executor repeat test': function () {
            scene.clearScene();
            let obj = new GameObject("testObject");
            scene.addGlobalGameObject(obj);
            let repeatCounter1 = 0;
            let repeatCounter2 = 0;

            let executor = new ExecutorComponent()
                .beginRepeat(3) // via literal
                    .execute(() => repeatCounter1++)
                .endRepeat()
                .execute(() => assert(repeatCounter1 == 3, "Wrong counter value"))
                .beginRepeat(() => 3) // via function
                    .execute(() => repeatCounter2++)
                .endRepeat()
                .execute(() => assert(repeatCounter2 == 3, "Wrong counter value"));

            obj.addComponent(executor);

            let counter = 0;
            while (!executor.isFinished) { // simulate game loop
                scene.update(0.1, counter);
                counter += 0.1;
            }
        },

        'Executor while test': function () {
            scene.clearScene();
            let obj = new GameObject("testObject");
            scene.addGlobalGameObject(obj);
            let param = 3;
            let execCounter = 0;

            let executor = new ExecutorComponent()
                .beginWhile(() => param > 0)
                    .execute(() => param--)
                    .execute(() => execCounter++)
                .endWhile()
                .execute(() => assert(param == 0, "Wrong parameter value : " + param + ", expected 0"))
                .execute(() => assert(execCounter == 3, "While should have be called 3x"));

            obj.addComponent(executor);

            let counter = 0;
            while (!executor.isFinished) { // simulate game loop
                scene.update(0.1, counter);
                counter += 0.1;
            }
        },

        'Executor interval by literal test': function () {
            scene.clearScene();
            let obj = new GameObject("testObject");
            scene.addGlobalGameObject(obj);
            let intervalCntr = 0;
            let counter = 0;

            let executor = new ExecutorComponent()
                .beginInterval(3) // via literal
                    .execute(() => {
                        if(intervalCntr == 0) {
                            // first loop -> check if the time matches
                            assert(parseInt(counter) == 3, "Method executed in a different time than expected");
                        }
                    })
                    .execute(() => intervalCntr++)
                    .execute((cmp) => {
                        // finish after 3 rounds
                        if(intervalCntr >= 3) cmp.finish();
                    })
                .endInterval()

            obj.addComponent(executor);

            
            while (!executor.isFinished) { // simulate game loop
                scene.update(0.1, counter);
                counter += 0.1;
            }
        },

        'Executor interval by function test': function () {
            scene.clearScene();
            let obj = new GameObject("testObject");
            scene.addGlobalGameObject(obj);
            let currentInterval = 4;
            let intervalCntr = 0;
            let counter = 0;

            let executor = new ExecutorComponent()
                .beginInterval(() => currentInterval) // via function
                    .execute(() => {
                        switch(intervalCntr){
                            case 0:
                                assert(parseInt(counter) == 4, "Method executed in a different time than expected");
                            break;
                            case 1:
                                assert(parseInt(counter) == 7, "Method executed in a different time than expected");
                            break;
                            case 2:
                                assert(parseInt(counter) == 9, "Method executed in a different time than expected");
                            break;
                        }
                    })
                    .execute(() => {
                        intervalCntr++;
                        currentInterval--; // decrease the interval with every loop
                    })
                    .execute((cmp) => {
                        // finish after 3 rounds
                        if(intervalCntr >= 3) cmp.finish();
                    })
                .endInterval()

            obj.addComponent(executor);

            
            while (!executor.isFinished) { // simulate game loop
                scene.update(0.1, counter);
                counter += 0.1;
            }
        },
        'Executor if-else test': function () {
            scene.clearScene();

            let rot = new RotationAnim();
            let obj = new GameObject("gameObj");
            scene.addGlobalGameObject(obj);

            let executor = new ExecutorComponent()
                .waitTime(3) // execute with a delay				
                .beginIf(() => true)
                .execute(() => console.log("1"))
                .beginIf(() => false)
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .endIf()
                .beginIf(() => false)
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .beginIf(() => false)
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .else()
                .execute(() => assert(false, "this closure shouldn't be executed!"))
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
                .execute(() => assert(false, "this closure shouldn't be executed!"))
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
                .addComponent(rot, rect2)
                .waitTime(2)
                .execute(() => rot.finish())
                .waitForFinish(rot)
                .waitUntil(() => {
                    return Math.random() > 0.9;
                })
                .waitFrames(10)
                .execute((cmp) => cmp.scene.addPendingInvocation(2, () => cmp.sendmsg("MOJO")))
                .waitForMessage("MOJO");


            obj.addComponent(executor);

            let counter = 0;
            while (!executor.isFinished) {
                scene.update(0.1, counter);
                counter += 0.1;
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