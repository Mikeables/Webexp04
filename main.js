// 创建一个新的Phaser游戏实例
// 参数依次为：游戏宽度、游戏高度、渲染模式（这里是自动选择合适的渲染模式）、
// 父容器（这里为null，表示没有父容器）、包含预加载、创建和更新等阶段函数的对象
var game = new Phaser.Game(480, 320, Phaser.AUTO, null, {preload: preload, create: create, update: update});

// 定义游戏中用到的各种变量
var ball; // 代表游戏中的球
var paddle; // 代表游戏中的球拍
var bricks; // 用于存储所有砖块的组
var newBrick; // 临时用于创建单个砖块的变量
var brickInfo; // 存储砖块相关信息的对象
var scoreText; // 用于显示得分的文本对象
var score = 0; // 记录玩家的得分，初始化为0
var lives = 3; // 玩家的初始生命数
var livesText; // 用于显示剩余生命数的文本对象
var lifeLostText; // 当玩家失去一条生命时显示的提示文本对象
var playing = false; // 用于标记游戏是否正在进行的布尔变量
var startButton; // 游戏开始按钮

// 预加载函数，在游戏开始前加载所需的资源
function preload() {
    // 设置游戏的缩放模式为显示全部内容，确保游戏在不同尺寸屏幕上能完整显示
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    // 水平方向上页面内容对齐
    game.scale.pageAlignHorizontally = true;
    // 垂直方向上页面内容对齐
    game.scale.pageAlignVertically = true;
    // 设置游戏舞台的背景颜色为浅灰色
    game.stage.backgroundColor = '#eee';
    // 加载球拍的图片资源，指定图片路径为'paddle.png'
    game.load.image('paddle', 'paddle.png');
    // 加载砖块的图片资源，指定图片路径为'brick.png'
    game.load.image('brick', 'brick.png');
    // 加载球的精灵表资源，指定图片路径为'wobble.png'，以及每一帧的宽度和高度为20像素
    game.load.spritesheet('ball', 'wobble.png', 20, 20);
    // 加载按钮的精灵表资源，指定图片路径为'button.png'，以及每一帧的宽度和高度分别为120像素和40像素
    game.load.spritesheet('button', 'button.png', 120, 40);
}

// 创建函数，在游戏资源加载完成后创建游戏中的各种对象和设置初始状态
function create() {
    // 启动Phaser的物理系统，这里使用的是ARCADE物理引擎
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // 设置在物理碰撞检测中不检查向下的碰撞（可能根据游戏具体需求而定）
    game.physics.arcade.checkCollision.down = false;
    // 在游戏世界的中心位置（水平方向）、距离底部25像素的位置创建球的精灵对象，并指定使用'ball'这个图像资源
    ball = game.add.sprite(game.world.width*0.5, game.world.height-25, 'ball');
    // 为球添加一个名为'wobble'的动画，指定动画帧序列以及播放速度（每秒24帧）
    ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);
    // 设置球的锚点为其中心（0.5表示中心位置），用于确定旋转、缩放等操作的中心点
    ball.anchor.set(0.5);
    // 启用球的物理属性，使其能够参与物理模拟，使用的是ARCADE物理引擎
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    // 设置球在碰到游戏世界边界时能够反弹
    ball.body.collideWorldBounds = true;
    // 设置球的反弹系数为1，即完全弹性碰撞，碰到物体后以相同速度反弹
    ball.body.bounce.set(1);
    // 设置检查球是否超出游戏世界边界
    ball.checkWorldBounds = true;
    // 当球超出游戏世界边界时，调用ballLeaveScreen函数，并将当前上下文（this）传递给该函数
    ball.events.onOutOfBounds.add(ballLeaveScreen, this);

    // 在游戏世界的中心位置（水平方向）、距离底部5像素的位置创建球拍的精灵对象，并指定使用'paddle'这个图像资源
    paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');
    // 设置球拍的锚点，水平方向为中心（0.5），垂直方向为底部（1）
    paddle.anchor.set(0.5,1);
    // 启用球拍的物理属性，使其能够参与物理模拟，使用的是ARCADE物理引擎
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    // 设置球拍为不可移动的物体，在与其他物体碰撞时不会被推动
    paddle.body.immovable = true;

    // 初始化砖块的函数调用
    initBricks();

    // 设置文本样式对象，指定字体为18像素的Arial字体，颜色为蓝色（十六进制颜色码 '#0095DD'）
    textStyle = { font: '18px Arial', fill: '#0095DD' };
    // 在游戏世界的左上角（坐标为(5, 5)）创建用于显示得分的文本对象，并初始设置文本内容为'Points: 0'，应用之前定义的文本样式
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
    // 在游戏世界的右上角（坐标根据游戏世界宽度动态计算，使其右对齐）创建用于显示剩余生命数的文本对象，
    // 初始设置文本内容为'Lives: '加上当前生命数，应用之前定义的文本样式，并设置锚点使其右对齐（水平方向为1，垂直方向为0）
    livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle);
    livesText.anchor.set(1,0);
    // 在游戏世界的中心位置创建当玩家失去一条生命时显示的提示文本对象，初始设置文本内容为'Life lost, tap to continue'，
    // 应用之前定义的文本样式，并设置锚点为中心（0.5），初始时该文本对象不可见
    lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, tap to continue', textStyle);
    lifeLostText.anchor.set(0.5);
    lifeLostText.visible = false;

    // 在游戏世界的中心位置创建游戏开始按钮的精灵对象，指定使用'button'这个图像资源，
    // 当按钮被点击时调用startGame函数，并传递当前上下文（this），同时指定按钮的不同状态对应的帧索引（这里分别为1、0、2）
    startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2);
    startButton.anchor.set(0.5);
}

// 更新函数，在每一帧都会被调用，用于更新游戏中的各种逻辑和状态
function update() {
    // 进行球和球拍之间的物理碰撞检测，当发生碰撞时调用ballHitPaddle函数
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    // 进行球和砖块之间的物理碰撞检测，当发生碰撞时调用ballHitBrick函数
    game.physics.arcade.collide(ball, bricks, ballHitBrick);
    if(playing) {
        // 如果游戏正在进行，设置球拍的x坐标为当前鼠标的x坐标（如果鼠标在游戏窗口内），
        // 否则将球拍设置在游戏世界的中心位置（水平方向）
        paddle.x = game.input.x || game.world.width*0.5;
    }
}

// 初始化砖块的函数定义
function initBricks() {
    // 定义砖块的相关信息对象
    brickInfo = {
        width: 50, // 单个砖块的宽度为50像素
        height: 20, // 单个砖块的高度为20像素
        count: {
            row: 7, // 砖块排列的行数为7行
            col: 3 // 砖块排列的列数为3列
        },
        offset: {
            top: 50, // 砖块组相对于游戏世界顶部的偏移量为50像素
            left: 60 // 砖块组相对于游戏世界左侧的偏移量为60像素
        },
        padding: 10 // 砖块之间的间距为10像素
    }
    // 创建一个用于存储所有砖块的组对象
    bricks = game.add.group();
    for(c=0; c<brickInfo.count.col; c++) {
        for(r=0; r<brickInfo.count.row; r++) {
            // 计算每个砖块在游戏世界中的x坐标，根据当前行、砖块宽度、间距以及偏移量来确定
            var brickX = (r*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left;
            // 计算每个砖块在游戏世界中的y坐标，根据当前列、砖块高度、间距以及偏移量来确定
            var brickY = (c*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top;
            // 在计算好的坐标位置创建一个新的砖块精灵对象，并指定使用'brick'这个图像资源
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            // 启用新创建砖块的物理属性，使其能够参与物理模拟，使用的是ARCADE物理引擎
            game.physics.enable(newBrick, Phaser.Physics.ARCADE);
            // 设置新创建的砖块为不可移动的物体，在与其他物体碰撞时不会被推动
            newBrick.body.immovable = true;
            // 设置新创建砖块的锚点为其中心（0.5表示中心位置），用于确定旋转、缩放等操作的中心点
            newBrick.anchor.set(0.5);
            // 将新创建的砖块添加到砖块组中
            bricks.add(newBrick);
        }
    }
}

// 当球击中砖块时调用的函数
function ballHitBrick(ball, brick) {
    // 创建一个用于改变砖块缩放属性的缓动动画对象
    var killTween = game.add.tween(brick.scale);
    // 设置缓动动画的目标属性，将砖块的x和y缩放比例在200毫秒内变为0，
    // 使用线性缓动效果（Phaser.Easing.Linear.None）
    killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None);
    // 当缓动动画完成时，调用一次内部定义的匿名函数，在该匿名函数中销毁被击中的砖块
    killTween.onComplete.addOnce(function(){
        brick.kill();
    }, this);
    // 启动缓动动画
    killTween.start();
    // 玩家得分增加10分
    score += 10;
    // 更新显示得分的文本内容
    scoreText.setText('Points: '+score);
    if(score === brickInfo.count.row*brickInfo.count.col*10) {
        // 如果玩家得分达到所有砖块的总分数（行数乘以列数再乘以每个砖块的分值10），
        // 弹出提示框告知玩家获胜，并重新加载页面
        alert('You won the game, congratulations!');
        location.reload();
    }
}

// 当球离开游戏屏幕（超出边界）时调用的函数
function ballLeaveScreen() {
    // 玩家生命数减1
    lives--;
    if(lives) {
        // 如果玩家还有剩余生命，更新显示剩余生命数的文本内容
        livesText.setText('Lives: '+lives);
        // 显示当玩家失去一条生命时的提示文本
        lifeLostText.visible = true;
        // 将球重置到游戏世界的中心位置（水平方向）、距离底部25像素的位置
        ball.reset(game.world.width*0.5, game.world.height-25);
        // 将球拍重置到游戏世界的中心位置（水平方向）、距离底部5像素的位置
        paddle.reset(game.world.width*0.5, game.world.height-5);
        // 当玩家在屏幕上点击时，调用一次内部定义的匿名函数，在该匿名函数中隐藏失去生命的提示文本，
        // 并设置球的初始速度为向上（y方向为 -150）、向右（x方向为150）
        game.input.onDown.addOnce(function(){
            lifeLostText.visible = false;
            ball.body.velocity.set(150, -150);
        }, this);
    }
    else {
        // 如果玩家生命数为0，弹出提示框告知玩家游戏失败，并重新加载页面
        alert('You lost, game over!');
        location.reload();
    }
}

// 当球击中球拍时调用的函数
function ballHitPaddle(ball, paddle) {
    // 播放球的'wobble'动画
    ball.animations.play('wobble');
    // 根据球击中球拍的位置来设置球在x方向的速度，实现不同角度的反弹效果
    ball.body.velocity.x = -1*5*(paddle.x-ball.x);
}

// 当游戏开始按钮被点击时调用的函数
function startGame() {
    // 销毁游戏开始按钮
    startButton.destroy();
    // 设置球的初始速度为向上（y方向为 -150）、向右（x方向为150）
    ball.body.velocity.set(150, -150);
    // 将游戏正在进行的标记设置为true
    playing = true;
}