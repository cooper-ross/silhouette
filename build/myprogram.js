"use strict";
// Programmer's Name: Cooper Ross
// Program Name: Final Game Gr10 GameQuery
//////////////////////////////////////////////////////////////////////////
/*
 * Copyright 2012, 2016, 2019, 2020 Cheng
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     https://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//import { newGQAnimation, createGroupInPlayground, createSpriteInGroup, spriteGetX, spriteGetY, spriteSetXY, spriteGetWidth, spriteGetHeight, PLAYGROUND_HEIGHT, PLAYGROUND_WIDTH, getKeyState, spriteSetAnimation, ANIMATION_HORIZONTAL, forEachSpriteGroupCollisionDo, sprite, getMouseButton1, getMouseX, getMouseY, spriteExists, removeSprite, consolePrint, spriteRotate, createRectInGroup, spriteId, spriteHitDirection, createTextSpriteInGroup, disableContextMenu, textInputSpriteSetHandler } from "./libs/lib-gqguardrail-exports.ts";
//import "./libs/lib-gqguardrail-exports.ts";
// Don't edit the import lines above, or you won't be able to write your program!
// Also, do not use the following variable and function names in your own code below:
//    setup, draw, Fn
// and the other imported names above.
// Write your program below this line:
// ***********************************
const leaderboardCRUD = async (data) => {
	// Use fetch to send the data to the server
	const response = await fetch('/data', {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	const responseData = await response.json();
	const dataDB = await responseData;
	return await dataDB;
};

// Global vars
let levelNumber = 6;
let gameState = "menu";
let startTime = Date.now();
let deaths = 0;
let scrollAmount = 0;
let waitTimer;
let finalTime = 10000000; // just in case of a bug, it's set really high
let pausedTime = 0;
let missleCount = 0;
let skipped = false;
let leaderBoardData = { "if you can see this something went very wrong": 340123 };
let keyMap = {
	boost: 32,
	jump: 87,
	left: 65,
	right: 68,
	screenRight: 39,
	screenLeft: 37,
	pause: 27,
	restart: 82
};
const scoreSpriteNames = ["scoreboardDisplayRanks", "scoreboardDisplayTimes", "scoreboardDisplayNames"];

/*
 * This code checks if the users keyMap has been saved to localstorage. 
 * It can assign the controls, and if they don't have anything saved it will go by default.
 * Then, it will save the default so they have something next time they log in
*/
let loadedKeyMapString = localStorage.getItem('keyMap');
if (loadedKeyMapString != null) keyMap = JSON.parse(loadedKeyMapString);

// For loading custom levels!
let specialLevelData;

// Empty tracking arrays
let levelBlocks = [];
let remapButtons = [];
let missiles = [];

// Camera and camera constraints
let xOffset = 669;
let yOffset = 0;
let minX = -1200;
const maxX = 750;
const lerpFactor = 0.1;

// Change if you want extra info
const debug = false;

// Mouse movement, but slightly better (for level editor)
let mouseX = 0;
let mouseY = 0;
$(document).mousemove(function(e){
	var position = {x: e.pageX, y: e.pageY};
	mouseY = position.y;
	mouseX = position.x;
	//console.log(mouseX, mouseY);
});
let firstClickOnLevel = false;
let mouseButtonPressed = false;
let indexOfLevelBlocks = 0;


// Groups
const backgroundGroupName = "backgroundGroup";
createGroupInPlayground(backgroundGroupName);

const collisionGroupName = "collisionGroup";
createGroupInPlayground(collisionGroupName);

const bounceGroupName = "bounceGroup";
createGroupInPlayground(bounceGroupName);

const playerGroupName = "playerGroup";
createGroupInPlayground(playerGroupName);

const enemyGroupName = "ememyGroup";
createGroupInPlayground(enemyGroupName);

const uiGroupName = "uiGroup";
createGroupInPlayground(uiGroupName);

const textGroupName = "textGroup";
createGroupInPlayground(textGroupName);

const popupGroupName = "popupGroup";
createGroupInPlayground(popupGroupName);

// Easy-Access Level Data
const spawnPoint = {
	1: [-350, 422],
	2: [-350, 422],
	3: [-350, 422],
	4: [-350, 422],
	5: [-350, 323],
	6: [-350, 422]
};

const level1Data = [
	{ x: -750, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
	{ x: 0, y: PLAYGROUND_HEIGHT - 60, size: "20x480" },
	{ x: 135, y: PLAYGROUND_HEIGHT - 80, size: "100x640" },
	{ x: 350, y: PLAYGROUND_HEIGHT - 60, size: "20x480" },
	{ x: 500, y: PLAYGROUND_HEIGHT - 100, size: "100x640" },
	{ x: 500, y: PLAYGROUND_HEIGHT - 200, size: "100x20" },
	{ x: 690, y: PLAYGROUND_HEIGHT - 240, size: "100x20" },
	{ x: 860, y: PLAYGROUND_HEIGHT - 300, size: "100x20" },
	{ x: 1050, y: PLAYGROUND_HEIGHT - 350, size: "100x640" },
	{ x: 1200, y: 100 - PLAYGROUND_HEIGHT, size: "100x640" },
	{ x: 1400, y: PLAYGROUND_HEIGHT - 20, size: "640x640" }
];

/* 
 * Moving blocks!
 * Any block with a size that starts with 'MB' is a moving block
 * Input info:
 *   MB: 100x20 RG: 600,  1000, 0,    0    SP: 5,      0
 *   MB: sizeXY RG: minX, maxX, minY, maxY SP: xSpeed, ySpeed
 */
const level2Data = [
	{ x: -750, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
	{ x: -160, y: PLAYGROUND_HEIGHT - 48, size: "38x29" },
	{ x: -40, y: PLAYGROUND_HEIGHT - 300, size: "100x640" },
	{ x: 120, y: 250 - PLAYGROUND_HEIGHT, size: "100x640" },
	{ x: 210, y: PLAYGROUND_HEIGHT - 28, size: "38x29" },
	{ x: 400, y: PLAYGROUND_HEIGHT - 300, size: "100x640" },
	{ x: 500, y: PLAYGROUND_HEIGHT - 200, size: "100x20" },
	{ x: 600, y: PLAYGROUND_HEIGHT - 200, size: "MB: 100x20 RG: 600,1000,0,0 SP: 5,0" },
	{ x: 1100, y: PLAYGROUND_HEIGHT - 300, size: "100x640" },
	{ x: 1200, y: PLAYGROUND_HEIGHT - 200, size: "MB: 100x20 RG: 0,1000,200,460 SP: 0,5" },
	{ x: 1300, y: 150 - PLAYGROUND_HEIGHT, size: "100x640" },
	{ x: 1400, y: PLAYGROUND_HEIGHT - 200, size: "MB: 100x20 RG: 0,1000,200,460 SP: 0,5" },
	{ x: 1500, y: PLAYGROUND_HEIGHT - 300, size: "100x640" },
	{ x: 1600, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
];

const level3Data = [
	{ x: -750, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
	{ x: -10, y: PLAYGROUND_HEIGHT - 60, size: "20x480" },
	{ x: 100, y: PLAYGROUND_HEIGHT - 200, size: "MB: 20x100 RG: -750,1000,200,360 SP: 0,5" },
	{ x: 150, y: PLAYGROUND_HEIGHT - 60, size: "100x640" },
	{ x: 150, y: 120 - PLAYGROUND_HEIGHT, size: "100x640" },
	{ x: 300, y: PLAYGROUND_HEIGHT - 28, size: "38x29" },
	{ x: 300, y: PLAYGROUND_HEIGHT - 300, size: "MB: 100x20 RG: 250,350,0,0 SP: 5,0" },
	{ x: 400, y: PLAYGROUND_HEIGHT - 280, size: "20x480" },
	{ x: 500, y: PLAYGROUND_HEIGHT - 200, size: "100x20" },
	{ x: 900, y: PLAYGROUND_HEIGHT - 100, size: "100x20" },
	{ x: 1200, y: PLAYGROUND_HEIGHT - 200, size: "100x20" },
	{ x: 1400, y: PLAYGROUND_HEIGHT - 300, size: "100x20" },
	{ x: 1600, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
];

const level4Data = [
	{ x: -750, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
	{ x: -10, y: PLAYGROUND_HEIGHT - 60, size: "20x480" },
	{ x: 90, y: PLAYGROUND_HEIGHT - 100, size: "20x480" },
	{ x: 190, y: PLAYGROUND_HEIGHT - 140, size: "20x480" },
	{ x: 390, y: PLAYGROUND_HEIGHT - 140, size: "20x480" },
	{ x: 700, y: PLAYGROUND_HEIGHT - 100, size: "20x480" },
	{ x: 1000, y: PLAYGROUND_HEIGHT - 140, size: "20x480" },
	{ x: 1200, y: PLAYGROUND_HEIGHT - 100, size: "20x480" },
	{ x: 1500, y: PLAYGROUND_HEIGHT - 120, size: "640x640" }
];

const level5Data = [
	{ x: -750, y: PLAYGROUND_HEIGHT - 120, size: "640x640" },
	{ x: 100, y: PLAYGROUND_HEIGHT - 200, size: "MB: 20x100 RG: -750,1000,200,360 SP: 0,5" },
	{ x: 300, y: PLAYGROUND_HEIGHT - 250, size: "MB: 20x100 RG: -750,1000,200,360 SP: 0,5" },
	{ x: 500, y: PLAYGROUND_HEIGHT - 120, size: "100x640" },
	{ x: 600, y: PLAYGROUND_HEIGHT - 28, size: "38x29" },
	{ x: 900, y: PLAYGROUND_HEIGHT - 100, size: "100x20" },
	{ x: 1200, y: PLAYGROUND_HEIGHT - 200, size: "100x20" },
	{ x: 1300, y: 300 - PLAYGROUND_HEIGHT, size: "20x480" },
	{ x: 1380, y: PLAYGROUND_HEIGHT - 28, size: "38x29" },
	{ x: 1600, y: PLAYGROUND_HEIGHT - 200, size: "20x480" },
	{ x: 1600, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
];

const level6Data = [
	{ x: -750, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
	{ x: -700, y: PLAYGROUND_HEIGHT - 250, size: "MB: 100x20 RG: -750,600,0,0 SP: 5,0" },
	{ x: -110, y: PLAYGROUND_HEIGHT - 100, size: "100x640" },
	{ x: -10, y: PLAYGROUND_HEIGHT - 20, size: "640x640" },
	{ x: 110, y: PLAYGROUND_HEIGHT - 100, size: "100x640" },
	{ x: 630, y: 0, size: "640x640" },
];

const levelData = {
	1: level1Data,
	2: level2Data,
	3: level3Data,
	4: level4Data,
	5: level5Data,
	6: level6Data
};

/*
 * The player is made up of 2 sprites:
 * 1. the invisible hitbox, and
 * 2. the animation / visible sprite.
 * This dict stores all the data required for *both*, including velocity and animations.
 */
let playerData = {
	"hitboxId": "playerHitbox",
	"hitboxWidth": 13,
	"hitboxHeight": 37,
	"xPos": spawnPoint[levelNumber][0],
	"yPos": spawnPoint[levelNumber][1],
	"xSpeed": 0,
	"ySpeed": 0,
	"groundColliding": true,
	"coyoteTime": 6,
	"coyoteCounter": 0,
	"boostCooldown": Date.now(),
	//---------------------------
	"spriteId": "playerSprite",
	"spriteWidth": 43,
	"spriteHeight": 55,
	"animState": "idle",
	"lastDirection": 1,
	"animHitbox": newGQAnimation("img/player/hitbox.png"),
	"animIdleLeft": newGQAnimation("img/player/idleLeft.png"),
	"animIdleRight": newGQAnimation("img/player/idleRight.png"),
	"animJumpLeft": newGQAnimation("img/player/jumpLeft.png"),
	"animJumpRight": newGQAnimation("img/player/jumpRight.png"),
	"animJumpStraight": newGQAnimation("img/player/jumpStraight.png"),
	"animRunCycleLeft": newGQAnimation("img/player/runCycleLeft.png", 11, 43, 25, ANIMATION_HORIZONTAL),
	"animRunCycleRight": newGQAnimation("img/player/runCycleRight.png", 11, 43, 25, ANIMATION_HORIZONTAL),
};

// Boss fight
let droneData = {
	"id": "droneDataBoss",
	"health": 540,
	"width": 196,
	"height": 53,
	"xPos": 200,
	"yPos": 200,
	"xSpeed": 0,
	"ySpeed": 0,
	"yPeriod": 4000,
	"yAmplitude": 25,
	"attackState": "passive",
	"targetX": 0,
	"targetY": 0,
	"timer": Date.now(),
	"pauseOnGround": Date.now(),
	"droneFly": newGQAnimation("img/enemies/droneFly.png", 2, 196, 25, ANIMATION_HORIZONTAL),
};

// More preloaded stuff
const screensForMenu = {
	"id": "screenSwitcher",
	"menuState": "main",
	"blankMenu": newGQAnimation("img/screens/blank.png"),
	"mainMenu": newGQAnimation("img/screens/main.png"),
	"remapOverlay": newGQAnimation("img/screens/remap.png"),
	"settingsMenu": newGQAnimation("img/screens/settings.png"),
	"leaderboardMenu": newGQAnimation("img/screens/leaderboard.png"),
	"winScreen": newGQAnimation("img/screens/winScreen.png"),
};

const preloadedAssets = {
	"controls": newGQAnimation("img/ui/controls.png"),
	"bossControls": newGQAnimation("img/ui/boss.png"),
	"titleCard": newGQAnimation("img/ui/titlecard.png"),
	"background": newGQAnimation("img/ground/background.png"),
	"input": newGQAnimation("img/screens/input.png"),
	"wave1": newGQAnimation("img/ground/wave.png"),
	"wave2": newGQAnimation("img/ground/wave2.png"),
	"640x640": newGQAnimation("img/ground/640x640.png"),
	"20x480": newGQAnimation("img/ground/20x480.png"),
	"100x20": newGQAnimation("img/ground/100x20.png"),
	"20x100": newGQAnimation("img/ground/20x100.png"),
	"100x640": newGQAnimation("img/ground/100x640.png"),
	"38x29": newGQAnimation("img/ground/38x29.png"),
	"pauseMenu": newGQAnimation("img/ui/pause.png"),
	"mainOverlay": newGQAnimation("img/ui/mainOverlay.png"),
	"bossOverlay": newGQAnimation("img/ui/bossOverlay.png"),
	"dronePredict": newGQAnimation("img/enemies/dronePredict.png")
};

// Utility functions
const lerp = (a, b, t) => (1 - t) * a + t * b;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const resetGameState = () => {
	droneData["health"] = 540;
	minX = -1200;
	levelNumber = 1;
	playerData["xPos"] = spawnPoint[levelNumber][0];
	playerData["yPos"] = spawnPoint[levelNumber][1];
};

const styleTextSprite = (spriteName) => {
  	sprite(spriteName)
		.css("font-family", "Tahoma")
    	.css("background-color", "rgba(0, 0, 0, 0)")
		.css("text-align", "center")
		.css("color", "rgba(0, 0, 0, 1)")
		.css("font-size", "20pt")
}

const shakeSprite = (spriteName) => {
	$('#' + spriteName).css('animation', 'shake 0.5s');
	setTimeout(() => { $('#' + spriteName).css('animation', '') }, 500);
}

const removeMenu = () => {
	removeSprite("playButton");
	removeSprite("settingsButton");
	removeSprite("leaderboardButton");
	removeSprite("playerRunIcon");
	removeSprite("droneFollowIcon");
	removeSprite("groundIcon");
	removeSprite("titlecard");
	removeSprite("speedrunTimerMainDisplay");
	removeSprite("nameMainDisplay");
	removeSprite("levelLoadButton");
	removeSprite("levelEditorButton");
};

// Disable right click context menu
window.addEventListener("contextmenu", (e) => e.preventDefault());


// adding CSS syles (I was orginally going to add them into a new css file, but I was advised against it)
$(".button").each(() => {
	$(this).on("mouseenter mouseleave", function(event) {
		if (event.type === "mouseenter") {
			// Show the tooltip when the mouse enters the element
			$(this).tooltip("show");
		} else if (event.type === "mouseleave") {
			// Hide the tooltip when the mouse leaves the element
			$(this).tooltip("hide");
		}
	});
});

$("input[type=text]").css({
	width: "100%",
	padding: "12px 20px",
	margin: "8px 0",
	boxSizing: "border-box",
	border: "2px solid #a157cc",
	borderRadius: "4px"
});

var styles = `
	.button {
		background-color: #f284e1; 
		color: white;
		border-radius: 5px;
		border: none;
		padding: 10px 10px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 15px;
		margin: 4px 2px;
		transition-duration: 0.1s;
		cursor: pointer;
		font-weight: bold;
	}
	
	.button:hover {
		background-color: #9c54c7;
		transform: translateY(-2px);
	}
	
	.button:active {
		background-color: #5d1485;
		transform: translateY(4px);
	}
	
	.button1 {
		font-size: 20px;
  		padding: 11px 25px;
	}

 	.button2 {
  		color: black;
   		background: rgb(251,197,188);
		background: linear-gradient(0deg, rgba(251,197,188,1) 0%, rgba(254,164,164,1) 100%);
	}
	
	.button2:active {
 		color: black;
		background: rgb(245,174,163);
		background: linear-gradient(0deg, rgba(245,174,163,1) 0%, rgba(251,140,140,1) 100%);
	}

	.button3 {
		font-size: 20px;
  		padding: 11px 11px;
	}

	.loader {
	  border: 16px solid #f3f3f3;
	  border-top: 16px solid #f284e1;
	  border-right: 16px solid #d072d8;
	  border-left: 16px solid #aa5cca;
	  border-bottom: 16px solid #9746b4;
	  border-radius: 50%;
	  width: 50px;
	  height: 50px;
	  animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
	  0% { transform: rotate(0deg); }
	  100% { transform: rotate(360deg); }
	}
	
	.shake {
	  animation: shake 0.5s;
	}
	
	@keyframes shake {
	  10%, 90% {
	    margin-left: -1px;
	  }
	  20%, 80% {
	    margin-left: 2px;
	  }
	  30%, 50%, 70% {
	    margin-left: -4px;
	  }
	  40%, 60% {
	    margin-left: 4px;
	  }
	}

	.dropdown {
	  position: relative;
	  display: inline-block;
	}
	
	.dropdown-content {
	  	display: none;
	  	position: absolute;
	  	background-color: #f1f1f1;
		min-width: 160px;
   		font-family: Tahoma, Arial, sans-serif;
	  	z-index: 1;
	}
	
	.dropdown-content a {
	  color: black;
	  padding: 12px 16px;
	  text-decoration: none;
	  display: block;
	}
	
	.dropdown-content a:hover {background-color: #ddd;}
	
	.dropdown:hover .dropdown-content {display: block;}
	
	.dropdown:hover .button1 {background-color: #3e8e41;}


	.context-menu {
	  position: relative;
	  display: inline-block;
	}

	.dropdown-context-menu {
	  	position: absolute;
	  	background-color: #f1f1f1;
		min-width: 160px;
   		font-family: Tahoma, Arial, sans-serif;
	  	z-index: 1;
	}
	
	.dropdown-context-menu a {
	  color: black;
	  padding: 12px 16px;
	  text-decoration: none;
	  display: block;
	}
	
	.dropdown-context-menu a:hover {background-color: #ddd;}
	
	.context-menu:hover .button1 {background-color: #3e8e41;}

`;

var styleSheet = document.createElement("style")
styleSheet.innerText = styles
document.head.appendChild(styleSheet)

// *************************************************

// UILINKTOCODE
// mainMenu, removeMenu, createMenuMain, leaderboardLogic, winScreen, endOfGame, inputHandler, settingsMenu
const mainMenu = () => {
	if (screensForMenu["menuState"] == "main") {
		if (!spriteExists("playButton")) createMenuMain()
		if (spriteExists("droneFollowIcon")) spriteSetXY("droneFollowIcon", 200, droneData["yAmplitude"] * Math.sin(Date.now() * 2 * Math.PI / droneData["yPeriod"]) + 225);
	} else if (screensForMenu["menuState"] == "leaderboard") {

	}
};

const createMenuMain = () => {
	const xRelative = PLAYGROUND_WIDTH / 2 - 35;
	const yRelative = PLAYGROUND_HEIGHT / 2 + 150;
	if (!spriteExists(screensForMenu["id"])) createSpriteInGroup(backgroundGroupName, screensForMenu["id"], screensForMenu["blankMenu"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
	createSpriteInGroup(uiGroupName, "playerRunIcon", playerData["animRunCycleRight"], playerData["spriteWidth"], playerData["spriteHeight"], 360, PLAYGROUND_HEIGHT / 2 + 75)
	createSpriteInGroup(uiGroupName, "droneFollowIcon", droneData["droneFly"], droneData["width"], droneData["height"], 200, yRelative + 200)
	createSpriteInGroup(uiGroupName, "groundIcon", preloadedAssets["640x640"], PLAYGROUND_WIDTH - 33, PLAYGROUND_WIDTH - 545, 16, PLAYGROUND_HEIGHT / 2 + 130)
	createSpriteInGroup(uiGroupName, "titlecard", preloadedAssets["titleCard"], 361, 99, 150, 70)
	spriteRotate("droneFollowIcon", 15);
	spriteRotate("titlecard", 5);

	createTextSpriteInGroup(textGroupName, "settingsButton", 75, 55, xRelative - 80, yRelative);
	$("#settingsButton")
		.append(`<button class="button button1" id="settingsButton" title="Settings" type="button"><i class="fa-solid fa-gear" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			screensForMenu["menuState"] = "settings";
			removeMenu();
			settingsMenu();
			spriteSetAnimation(screensForMenu["id"], screensForMenu["settingsMenu"]);
		}).appendTo('body');
	
	createTextSpriteInGroup(textGroupName, "playButton", 71, 55, xRelative, yRelative);
	$("#playButton")
		.append(`<button class="button button1" id="playButton" title="Play" type="button"><i class="fas fa-play" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			screensForMenu["menuState"] = "";
			gameState = "playing";
			startGame();
			removeMenu();
		}).appendTo('body');
	
	createTextSpriteInGroup(textGroupName, "leaderboardButton", 80, 55, xRelative + 75, yRelative);
	$("#leaderboardButton")
		.append(`<button class="button button1" id="leaderboardButton" title="Leaderboard" type="button"><i class="fa-solid fa-trophy" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			screensForMenu["menuState"] = "leaderboard";
			removeMenu();
			leaderboardLogic();
			spriteSetAnimation(screensForMenu["id"], screensForMenu["leaderboardMenu"]);
		}).appendTo('body');

	createTextSpriteInGroup(textGroupName, "levelLoadButton", 60, 55, 20, 20);
	$("#levelLoadButton")
		.append(`<button class="button button3" id="levelLoadButton" title="Load custom level data" type="button"><i class="fa-regular fa-clipboard" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.css("padding", "0px 5px")
		.click(async () => {
			const queryOpts = { name: 'clipboard-read', allowWithoutGesture: false };
			const permissionStatus = await navigator.permissions.query(queryOpts);

			if (permissionStatus.state === 'denied') {
				shakeSprite("levelLoadButton");
				return;
			}
			
			if (navigator.clipboard) {
				navigator.clipboard.readText().then(text => {
					try {
						var newLevel = JSON.parse(text);
						console.log(newLevel);
						gameState = "playingSpecial";
						specialLevelData = newLevel;
						removeMenu();
						startGame();
					} catch (error) {
						shakeSprite("levelLoadButton");
					}
				})
			} else {
				shakeSprite("levelLoadButton");
			}
		}).appendTo('body');

	createTextSpriteInGroup(textGroupName, "levelEditorButton", 60, 55, 65, 20);
	$("#levelEditorButton")
		.append(`<button class="button button3" id="levelEditorButton" title="Open level editor" type="button"><i class="fa-solid fa-screwdriver-wrench" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.css("padding", "0px 5px")
		.click(async () => {
			removeMenu();
			removeSprite(screensForMenu["id"]);
			screensForMenu["menuState"] = "";
			gameState = "editLevel";
		}).appendTo('body');
	
	let bestTime = localStorage.getItem('playerBestTime');
	let recentName = localStorage.getItem('playerRecentName');
	if (!bestTime || !recentName) return;
	
	bestTime = `${new Date(parseInt(bestTime)).toISOString().slice(11, -1)}`;
	
	createTextSpriteInGroup(textGroupName, "speedrunTimerMainDisplay", 200, 60, 23, 340);
	styleTextSprite("speedrunTimerMainDisplay");
	sprite("speedrunTimerMainDisplay").css("text-align", "left");

	createTextSpriteInGroup(textGroupName, "nameMainDisplay", 250, 60, 23, 310);
	styleTextSprite("nameMainDisplay");
	sprite("nameMainDisplay").css("text-align", "left");

	sprite("speedrunTimerMainDisplay").html(bestTime);
	sprite("nameMainDisplay").html(recentName);
}

const leaderboardLogic = async () => {
	createTextSpriteInGroup(textGroupName, "scoreboardDisplayRanks", 400, 500, PLAYGROUND_WIDTH / 2 - 390, PLAYGROUND_HEIGHT / 2 - 63);
	createTextSpriteInGroup(textGroupName, "scoreboardDisplayTimes", 400, 500, PLAYGROUND_WIDTH / 2 - 200, PLAYGROUND_HEIGHT / 2 - 63);
	createTextSpriteInGroup(textGroupName, "scoreboardDisplayNames", 400, 500, PLAYGROUND_WIDTH / 2 - 15, PLAYGROUND_HEIGHT / 2 - 63);
	scoreSpriteNames.forEach(spriteName => styleTextSprite(spriteName));

	// Create 'backButton'
	createTextSpriteInGroup(textGroupName, "backButton", 75, 100, 500, 45);
	$("#backButton")
		.append(`<button class="button button1" id="backButton" title="Back" type="button"><i class="fa-solid fa-rotate-left" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			screensForMenu["menuState"] = "main";
			spriteSetAnimation(screensForMenu["id"], screensForMenu["blankMenu"]);
			removeSprite("backButton");
			removeSprite("loader")
			removeMenu();
			scoreSpriteNames.forEach(spriteName => removeSprite(spriteName))
		}).appendTo('body');

	// Set a loading sprite and await the database data
	createTextSpriteInGroup(textGroupName, "loader", 50, 100, PLAYGROUND_WIDTH / 2 - 25, PLAYGROUND_HEIGHT / 2 - 10);
	$("#loader").append(`<div class="loader"></div>`).css("background", "rgba(0,0,0,0)");

	try {
		leaderBoardData = await leaderboardCRUD({ "message": "checkDB" });
	}
	catch (error) {
		removeSprite("loader")
		return sprite("scoreboardDisplayTimes").html("Load failed.");
	}
	removeSprite("loader")
	// This uses the Schwartzian transform, because you can't sort a dict (at least to my understanding)
	var items = Object.keys(leaderBoardData).map((key) => { return [key, leaderBoardData[key]]; });
	items.sort((first, second) => { return +first[1] - +second[1]; }); // Why am I doing the '+x - +x'? *Sometimes* throws random error (ts(2362)) if not done like this.
	var keys = items.map((e) => { return e[0]; });
	// First make a list of top 8
	var [displayRanks, displayTimes, displayNames] = ["", "", ""];
	for (let i = 0; i < 10; i++) {
		// Break if time is NaN, AKA no more existing items on list
		let playerTime = leaderBoardData[keys[i]];
		if (!playerTime)
			break;
		// Add to display var
		displayTimes = displayTimes + `${new Date(playerTime).toISOString().slice(11, -1)}<br>`;
		displayNames = displayNames + keys[i] + "<br>";
		// Use a regular expression to extract the last digit of the number and append the appropriate ordinal suffix
		displayRanks = displayRanks + (i + 1).toString().replace(/\d+$/, (match) => {
			return match + (match === "1" ? "st" : match === "2" ? "nd" : match === "3" ? "rd" : "th");
		}) + "<br>";
	}
	// Display the display vars
	const values = [displayRanks, displayTimes, displayNames];
	scoreSpriteNames.forEach((spriteName, index) => { sprite(spriteName).html(values[index]); });
};

const endOfGame = () => {
	updateHealth();
	if (Date.now() - waitTimer > 2000) {
		// Remove all sprites, besides a select few
		levelBlocks.forEach(blockDict => { removeSprite(blockDict["id"]); });
		missiles.forEach(missileDict => { removeSprite(missileDict["id"]); });
		levelBlocks = [];
		missiles = [];
		const removeSprites = [playerData["spriteId"], playerData["hitboxId"], "wave1", "wave2", droneData["id"], "healthBarMain", "healthBarSecond", "healthBarBack", "bossBarText", "restartButton"];
		removeSprites.forEach(name => { removeSprite(name); });
		if (spriteExists("dronePredict")) removeSprite("dronePredict");
		if (spriteExists("bossControls")) removeSprite("bossControls");
		if (spriteExists("remapOverlay")) removeSprite("remapOverlay");
		if (spriteExists("controls")) removeSprite("controls");
		removeSprite("overlaySprite");
		resetGameState();

		spriteSetXY("speedrunTimer", PLAYGROUND_WIDTH / 2 - 150, PLAYGROUND_HEIGHT / 2 - 85);
		sprite("speedrunTimer").css("color", "rgba(255, 255, 255, 255)").css("font-size", "35pt");

		if (skipped) sprite("speedrunTimer").html("You skipped.");
		spriteSetAnimation("backgroundImage", preloadedAssets["input"]);

		// Text input but "custom". I might be making extra work for myself here, but it's fun to figure out
		createTextSpriteInGroup(popupGroupName, "inputfield", 200, 200, PLAYGROUND_WIDTH / 2 - 100, PLAYGROUND_HEIGHT / 2 + 40);
		textInputSpriteSetHandler("inputfield", inputHandler);

		$("#inputfield").css("background-color", "rgba(0, 0, 0, 0)");
		$("#inputfield").append(`<input type="text" id="inputfield2" rows="2" cols="20"></input>`);
		$("#inputfield").append(`<style>div{text-align: center;}</style><button class="button" id="leaderboardButton" type="button">Add me to leaderboard!</button>`);
		$("#inputfield2").css("resize", "none");
		$("#leaderboardButton").click(inputHandler);

		gameState = "input";
	}
};

const inputHandler = () => {
	var inputValue = $("#inputfield2").val();
	if (inputValue.trim().length != 0) {
		if (inputValue in leaderBoardData || inputValue == "" || inputValue.length > 10 || inputValue.includes("\n")) {
			shakeSprite("inputfield");
			return;
		}
		
		if (spriteExists("inputfield")) removeSprite("inputfield");
		inputValue = inputValue.toString();
		inputValue = inputValue.replace(/[^a-zA-Z0-9\s]/g, ""); // This is my attempt at protecting myself from some kind of SQL injection
		if (!skipped && finalTime != null) {
			leaderboardCRUD({ [inputValue]: finalTime });
			localStorage.setItem("playerRecentName", inputValue);
			localStorage.setItem("playerBestTime", finalTime);
		}

		createSpriteInGroup(backgroundGroupName, screensForMenu["id"], screensForMenu["winScreen"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
		gameState = "final";
		spriteSetAnimation("backgroundImage", screensForMenu["background"]);
		removeSprite("speedrunTimer");
	}
};

const settingsMenu = () => {
	// Create 'backButton'
	createTextSpriteInGroup(textGroupName, "backButton", 75, 100, 500, 45);
	$("#backButton")
		.append(`<button class="button button1" id="backButton" title="Back" type="button"><i class="fa-solid fa-rotate-left" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			screensForMenu["menuState"] = "main";
			spriteSetAnimation(screensForMenu["id"], screensForMenu["blankMenu"]);
			removeSprite("backButton");
			removeSprite("resetButton");
			removeMenu();
			remapButtons.forEach(spriteName => removeSprite(spriteName));
			remapButtons = [];
		}).appendTo('body');

	createTextSpriteInGroup(textGroupName, "resetButton", 75, 100, 400, 45);
	$("#resetButton")
		.append(`<button class="button button1" id="resetButton" title="Reset to default" type="button"><i class="fa-solid fa-trash-can-arrow-up" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			keyMap = {
				boost: 32,
				jump: 87,
				left: 65,
				right: 68,
				screenLeft: 37,
				screenRight: 39,
				pause: 27,
				restart: 82
			};
			remapButtons.forEach((spriteName, index) => {
				$("#" + spriteName).html(`<button class="button button2" id="${spriteName}" title="Remap" type="button">  <span>${getKeyName(Object.values(keyMap)[index])}</span> </button>`);
			});
			localStorage.setItem('keyMap', JSON.stringify(keyMap));
		}).appendTo('body');

	newButtonRemapKey("boostRemapButton", "boost", 155, 190)
	newButtonRemapKey("jumpRemapButton", "jump", 155, 250)
	newButtonRemapKey("leftRemapButton", "left", 155, 310)
	newButtonRemapKey("rightRemapButton", "right", 155, 370)

	newButtonRemapKey("screenLeftRemapButton", "screenLeft", 495, 190)
	newButtonRemapKey("screenRightRemapButton", "screenRight", 495, 250)
	newButtonRemapKey("pauseRemapButton", "pause", 495, 310)
	newButtonRemapKey("restartRemapButton", "restart", 495, 370)
};

const getKeyName = (keyCode) => {
	var buttonText;
	switch (keyCode) {
		case 37: // Left arrow
	    	buttonText = 'Left Arrow'
	    	break;
		case 38: // Up arrow
			buttonText = 'Up Arrow'
	    	break;
		case 39: // Right arrow
	    	buttonText = 'Right Arrow'
	    	break;
		case 40: // Down arrow
	    	buttonText = 'Down Arrow'
	    	break;
		case 32: // Space bar
			buttonText = 'Space'
			break;
  		case 16: // Shift
			buttonText = 'Shift'
			break;
  		case 27: // Esc
			buttonText = 'Esc'
			break;
		default:
			buttonText = String.fromCharCode(keyCode);
	    	break;
	}
	return buttonText;
};

const newButtonRemapKey = (buttonName, keyName, posX, posY) => { // 'keyName' is a string like 'up'
	createTextSpriteInGroup(textGroupName, buttonName, 150, 50, posX, posY);
	remapButtons.push(buttonName);

	let buttonText = getKeyName(keyMap[keyName]);

	$("#" + buttonName)
		.append(`<button class="button button2" id="${buttonName}" title="Remap" type="button">  <span>${buttonText}</span> </button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			if (spriteExists("remapOverlay")) removeSprite("remapOverlay");
			$("#backButton").css({opacity: 0.5, pointerEvents: "none"});
			$("#resetButton").css({opacity: 0.5, pointerEvents: "none"});

			// Add a keydown event listener to the document
			console.log('added event listener with name of "keydown"')

			document.removeEventListener("keydown", window.panelEscapeKeyHandler);

			createSpriteInGroup(popupGroupName, "remapOverlay", screensForMenu["remapOverlay"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
		    window.panelEscapeKeyHandler = function onEscapeKey(event) {
				// The list of not allowed keys
				const bannedKeyCodes = [
				  	8,9,13,17,18,19,20,33,34,35,36,45,46,91,92,144,145,112,113,114,115,116,117,
					118,119,120,121,122,123,145,186,187,188,189,190,191,192,219,220,221,222
				];

				// Filter out certain keys like the command key, alt, tab, etc
				if (bannedKeyCodes.includes(event.keyCode)) {
					$("#backButton").css({
					    opacity: 1.0,
						pointerEvents: "all"
					});
					if (spriteExists("remapOverlay")) removeSprite("remapOverlay");
					document.removeEventListener("keydown", window.panelEscapeKeyHandler);
					return;
				}

				// Use the key code of the key that was pressed to remap the key
				keyMap[keyName] = event.keyCode;

				// Save into local storage
				localStorage.setItem('keyMap', JSON.stringify(keyMap));
				
				$("#backButton").css({opacity: 1, pointerEvents: "all"});
				$("#resetButton").css({opacity: 1, pointerEvents: "all"});
				document.removeEventListener("keydown", window.panelEscapeKeyHandler);

				$("#" + buttonName).html(`<button class="button button2" id="${buttonName}" title="Remap" type="button">  <span>${getKeyName(keyMap[keyName])}</span> </button>`);
				
				//removeSprite(buttonName)
				//newButtonRemapKey(buttonName, keyName, posX, posY);		
				if (spriteExists("remapOverlay")) removeSprite("remapOverlay");
		    };
		    document.addEventListener("keydown", window.panelEscapeKeyHandler);
		}).appendTo('body');

	$("#" + buttonName).on("keydown", function(event) {
		event.preventDefault();
	});
}


function removeEditor() {
	removeSprite("playButton");
	removeSprite("backButton");
	removeSprite("newBlockButton");
	removeSprite("exportLevelButton");
	removeSprite("loadLevelButton");
	removeSprite("contextMenuSprite");
	removeSprite("wave1");
	removeSprite("wave2");
}

const createLevelEditor = function() {
	// Background
	if (!spriteExists("backgroundImage")) createSpriteInGroup(backgroundGroupName, "backgroundImage", preloadedAssets["background"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT, 0, 0);

	// Create 2 waves: wave1 and wave2
	createSpriteInGroup(backgroundGroupName, "wave1", preloadedAssets["wave1"], PLAYGROUND_WIDTH * 5, PLAYGROUND_HEIGHT, 0, 0);
	createSpriteInGroup(backgroundGroupName, "wave2", preloadedAssets["wave2"], PLAYGROUND_WIDTH * 5, PLAYGROUND_HEIGHT, 0, 0);

	// Create player spawn pad
	newBlock(-750, PLAYGROUND_HEIGHT - 20, "640x640");

	createTextSpriteInGroup(textGroupName, "playButton", 40, 50, 10, 10);
	$("#playButton")
		.append(`<button class="button" id="playButton" title="Test your level" type="button"><i class="fa-solid fa-play" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {

			if (gameState == "editLevel") {
				let savedLevel = [];
				levelBlocks.forEach((block) => {
					savedLevel.push({ x: Math.floor(block["xPos"]), y: Math.floor(block["yPos"]), size: (block["width"].toString() + "x" + block["height"].toString())})
				});
				gameState = "playingSpecial";
				specialLevelData = savedLevel;
				//disable all the buttons
				$("#exportLevelButton, #loadLevelButton, #newBlockButton, #backButton").css({opacity: 0.5, pointerEvents: "none"})
	                .on("keydown", function(event) {
	                    event.preventDefault();
	                });
				$("#playButton").html(`<button class="button" id="playButton" title="Return to editor" type="button"><i class="fa-solid fa-stop"></i></button>`)
				
				createSpriteInGroup(playerGroupName, playerData["spriteId"], playerData["animIdleLeft"], playerData["spriteWidth"], playerData["spriteHeight"], playerData["xPos"], playerData["yPos"]);
				createSpriteInGroup(playerGroupName, playerData["hitboxId"], playerData["animHitbox"], playerData["hitboxWidth"], playerData["hitboxHeight"], playerData["xPos"], playerData["yPos"]);
			} else {
				gameState = "editLevel";
				removeSprite(playerData["spriteId"])
				removeSprite(playerData["hitboxId"])
				$("#exportLevelButton, #loadLevelButton, #newBlockButton, #backButton").css({opacity: 1.0, pointerEvents: "all"})
	                .off("keydown");
				$("#playButton").html(`<button class="button" id="playButton" title="Test your level" type="button"><i class="fa-solid fa-play"></i></button>`)
			}
		}).appendTo('body');


	createTextSpriteInGroup(textGroupName, "loadLevelButton", 40, 50, 92, 10);
	$("#loadLevelButton")
		.append(`<button class="button" id="loadLevelButton" title="Paste level code" type="button"><i class="fa-regular fa-clipboard"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
			.click(async () => {
			const queryOpts = { name: 'clipboard-read', allowWithoutGesture: false };
			const permissionStatus = await navigator.permissions.query(queryOpts);
			if (permissionStatus.state === 'denied') {
				shakeSprite("loadLevelButton");
				return;
			}
			if (navigator.clipboard) {
				navigator.clipboard.readText().then(text => {
					try {
						var newLevel = JSON.parse(text);
						levelBlocks.forEach((block) => { removeSprite(block["id"]); });
						levelBlocks = [];
						newLevel.forEach(({ x, y, size }) => { newBlock(x, y, size); });
					} catch (error) {
						shakeSprite("loadLevelButton");
					}
				})
			} else {
				shakeSprite("loadLevelButton");
			}
		}).appendTo('body');

	createTextSpriteInGroup(textGroupName, "exportLevelButton", 40, 50, 50, 10);
	$("#exportLevelButton")
		.append(`<button class="button" id="exportLevelButton" title="Copy level code" type="button"><i class="fa-solid fa-copy"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			let savedLevel = [];
			levelBlocks.forEach((block) => {
				savedLevel.push({ x: Math.floor(block["xPos"]), y: Math.floor(block["yPos"]), size: (block["width"].toString() + "x" + block["height"].toString())})
			});
			console.log(savedLevel)
			let levelString = JSON.stringify(savedLevel);
          	navigator.clipboard.writeText(levelString);
		}).appendTo('body');

	createTextSpriteInGroup(textGroupName, "backButton", 40, 50, 585, 10);
	$("#backButton")
		.append(`<button class="button" id="backButton" title="Back" type="button"><i class="fa-solid fa-rotate-left" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			gameState = "menu";
			screensForMenu["menuState"] = "main";
			levelBlocks.forEach((block) => { removeSprite(block["id"]); });
			levelBlocks = [];
			removeEditor();
			
		}).appendTo('body');
	
	createTextSpriteInGroup(textGroupName, "newBlockButton", 150, 290, 300, 10);
	$("#newBlockButton")
		.append(`
		<div class="dropdown">
		  <button title="New Block" id="chooseBlockDropdown" class="button"><i class="fa-solid fa-plus"></i></i></button>
		  <div id="dropdown-options" class="dropdown-content">
		    <a class="my-button" id="640x640">640x640</a>
		    <a class="my-button" id="20x480">20x480</a>
		    <a class="my-button" id="100x20">100x20</a>
	  		<a class="my-button" id="20x100">20x100</a>
			<a class="my-button" id="100x640">100x640</a>
   			<a class="my-button" id="38x29">Jump Pad</a>
		  </div>
		</div>`)
		.css("background", "rgba(0,0,0,0)")
		.appendTo("body");
	
	$("#chooseBlockDropdown").mouseenter(function(){
    	$("#dropdown-options").show();
	});

	$('.dropdown-content').on('click', '.my-button', function(event) {
	    console.log(this.id);
		$("#dropdown-options").hide();
		newBlock(750 - xOffset - (640 - mouseX) - 110, mouseY, this.id);
	});
}

const levelEditorContextMenu = function(blockId, indexOfBlock) {

	var menuPosX = mouseX - 10;
	var menuPosY = mouseY - 20;
	if ((160 + mouseX - 10) > PLAYGROUND_WIDTH) {
		menuPosX -= 160;
		console.log("WARNING")
	}
	if ((100 + mouseY - 20) > PLAYGROUND_HEIGHT) {
		menuPosY -= 80;
		console.log("WARNING")
	}
	
	createTextSpriteInGroup(textGroupName, "contextMenuSprite", 180, 120, menuPosX, menuPosY);
	$("#contextMenuSprite")
		.append(`
		<div class="dropdown">
		  <div id="dropdown-options" class="dropdown-context-menu">
		    <a class="editor-context-menu" id="delete">Delete</a>
   			<a class="editor-context-menu" id="duplicate">Duplicate</a>
		  </div>
		</div>`)
		.css("background", "rgba(0,0,0,0)")
		.appendTo("body");
	
	$('.dropdown-context-menu').on('click', '.editor-context-menu', function(event) {
	    console.log(this.id);

		if (this.id == "delete") {
			removeSprite(blockId);
			levelBlocks.splice(indexOfBlock, 1);
		} else if (this.id == "duplicate") {
			//removeSprite(blockId);
			let selectedBlock = levelBlocks[indexOfBlock];	
			newBlock(750 - xOffset - (640 - mouseX) - 110, mouseY, (selectedBlock["width"].toString() + "x" + selectedBlock["height"].toString()));
		}
		removeSprite("contextMenuSprite");
	});
}

let testXthing = 0;
const levelEditor = function() {
	// Create the editor layout
	if (!spriteExists("wave1")) createLevelEditor();
	
	// Move the camera with more control for the level editor
	scrollAmount = getKeyState(keyMap["screenLeft"]) ? scrollAmount = 10 : (getKeyState(keyMap["screenRight"]) ? scrollAmount = -10 : 0);
	xOffset = clamp(lerp(xOffset, xOffset + scrollAmount * 10, lerpFactor), minX, maxX);

	// Move the blocks
	moveBlocks();

	if (spriteExists("contextMenuSprite")) {
		if (spriteGetX("contextMenuSprite") - 10 > mouseX || spriteGetX("contextMenuSprite") + 170 < mouseX || spriteGetY("contextMenuSprite") - 10 > mouseY || spriteGetY("contextMenuSprite") + 110 < mouseY) {
			removeSprite("contextMenuSprite");
		}
	} else if (getMouseButton1() && levelBlocks.some(dict => dict.hasOwnProperty('draggable') && dict.draggable === true)) {
		// Dragging a block
		
	} else if (getMouseButton1()) {
		// Panning along the level by clicking and dragging
		if (!firstClickOnLevel) {
			firstClickOnLevel = true;
			testXthing = 750 - xOffset - (640 - mouseX) - 110;
		}
		//xOffset = mouseX - testXthing;
		xOffset = clamp(lerp(xOffset,  mouseX - testXthing, 0.5), minX, maxX);

		console.log(xOffset, mouseX, testXthing, getMouseButton1());
	} else {
		// Not doing anything
		firstClickOnLevel = false;
	}
}
// *************************************************

// CREATELINKTOCODE or BLOCKLINKTOCODE or MISSILELINKTOCODE (ctrl+f)
// newBlock, spawnMissle
const newBlock = (xPos, yPos, blockSize) => {
	if (blockSize.includes("MB")) {
		/* 
  		 * How moving platforms are handled. If the size includes 'MB' it is parsed differently, and has more values
		 * Takes: "MB: 100x20 RG: 100,1000,0,0 SP: 5,0" Returns: ["100", "20", "100", "1000", "0", "0", "5", "0"]
		 * Index Values:                                           0      1     2      3       4    5    6    7
		 *  0 and 1-> width, height
		 *  2 and 3 -> minXPos, maxXPos
		 *  4 and 5 -> minYPos, maxYPos
		 *  6 and 7 -> xSpeed, ySpeed
		*/
		const specialVals = blockSize.match(/-?\d+/g);
		if (specialVals == null) return consolePrint("You made a mistake inputting values into a movingblock");
		var width = parseInt(specialVals[0]);
		var height = parseInt(specialVals[1]);
		var [minXPos, maxXPos] = [parseInt(specialVals[2]), parseInt(specialVals[3])];
		var [minYPos, maxYPos] = [parseInt(specialVals[4]), parseInt(specialVals[5])];
		var [xSpeed, ySpeed] = [parseInt(specialVals[6]), parseInt(specialVals[7])];
		blockSize = `${specialVals[0]}x${specialVals[1]}`;
	} else {
		var width = parseInt(blockSize.split("x")[0]);
		var height = parseInt(blockSize.split("x")[1]);
		var [minXPos, maxXPos] = [0, 0];
		var [minYPos, maxYPos] = [0, 0];
		var [xSpeed, ySpeed] = [0, 0];
	}

	var i = levelBlocks.length; // Auto-updating index

	// Because blocks can be deleted in the editor, we need to keep track of them differently
	if (gameState == "editLevel") {
		i = indexOfLevelBlocks;
		indexOfLevelBlocks++;
	}
	
	var newBlockInfo = {
		"id": "block" + i,
		"width": width,
		"height": height,
		"xPos": xPos,
		"yPos": yPos,
		"xSpeed": xSpeed,
		"ySpeed": ySpeed,
		"minXPos": minXPos,
		"maxXPos": maxXPos,
		"minYPos": minYPos,
		"maxYPos": maxYPos,
		"640x640": preloadedAssets["640x640"],
		"20x480": preloadedAssets["20x480"],
		"100x20": preloadedAssets["100x20"],
		"20x100": preloadedAssets["20x100"],
		"100x640": preloadedAssets["100x640"],
		"38x29": preloadedAssets["38x29"]
	};

	if (gameState == "editLevel") {
		newBlockInfo["draggable"] = false;
		newBlockInfo["dragOffsetX"] = 0;
		newBlockInfo["dragOffsetY"] = 0;
	}

	levelBlocks.push(newBlockInfo);
	createSpriteInGroup((blockSize == "38x29") ? bounceGroupName : collisionGroupName, newBlockInfo["id"], newBlockInfo[blockSize], newBlockInfo["width"], newBlockInfo["height"], newBlockInfo["xPos"] + xOffset, newBlockInfo["yPos"] + yOffset);
	console.log("boost")
};

const spawnMissle = (xPos, yPos) => {
	// Instance the missile
	missleCount++;
	var missileInfo = {
		"id": "missile" + missleCount,
		"width": 24,
		"height": 14,
		"xPos": xPos,
		"yPos": yPos,
		"xSpeed": 0,
		"ySpeed": 0,
		"xTarget": playerData["xPos"],
		"yTarget": playerData["yPos"],
		"anim": newGQAnimation("img/enemies/missile.png")
	};
	missiles.push(missileInfo);

	createSpriteInGroup(enemyGroupName, missileInfo["id"], missileInfo["anim"], missileInfo["width"], missileInfo["height"], missileInfo["xPos"] + xOffset, missileInfo["yPos"] + yOffset);

	// Make the missile point towards its target
	var angle = Math.atan2(missileInfo["yTarget"] - missileInfo["yPos"], missileInfo["xTarget"] - missileInfo["xPos"]);

	// Convert the angle to degrees (degrees to radians)
	angle = angle * (180 / Math.PI);

	// Rotate the missile towards the player
	spriteRotate(missileInfo["id"], angle);

	// Calculate the velocity vector using trigonometry
	missileInfo["xSpeed"] = Math.cos(angle * (Math.PI / 180)) * 10;
	missileInfo["ySpeed"] = Math.sin(angle * (Math.PI / 180)) * 10;
};
// *************************************************

// SETUPLINKTOCODE
// setup, startGame, setupLevel
const setup = () => {
	createSpriteInGroup(uiGroupName, "overlaySprite", preloadedAssets["mainOverlay"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
};

const startGame = () => {
	// Remove menu
	if (spriteExists(screensForMenu["id"])) removeSprite(screensForMenu["id"]);

	// Reset button
	createTextSpriteInGroup(textGroupName, "restartButton", 75, 100, PLAYGROUND_WIDTH - 90, 10);
	$("#restartButton")
		.append(`<button class="button button1" onclick="return false;" id="restartButton" title="Restart from begining" tabindex="-1" type="button"><i class="fa-solid fa-rotate-right" style="margin-left: 2px;"></i></button>`)
		.css("background", "rgba(0,0,0,0)")
		.click(() => {
			if (specialLevelData) {
				startTime = Date.now();
				setupLevel()	
				playerData["xPos"] = spawnPoint[levelNumber][0];
				playerData["yPos"] = spawnPoint[levelNumber][1];
			} else {
				startTime = Date.now();
				resetGameState();
				setupLevel()	
			}
		}).appendTo('body');

	$("#restartButton").on("keydown", function(event) {
		event.preventDefault();
	});

	// Controls guide
	createSpriteInGroup(uiGroupName, "controls", preloadedAssets["controls"], 306, 326, PLAYGROUND_WIDTH / 2 - 153, PLAYGROUND_HEIGHT / 2 - 163);

	// Reset the timer in case they stayed on the menu for a while
	startTime = Date.now();

	// Setup level
	setupLevel();

	// Show the debug menu thing I use
	if (debug) createTextSpriteInGroup(textGroupName, "debugShown", 800, 30, 0, 0);

	// Timer
	createTextSpriteInGroup(textGroupName, "speedrunTimer", 300, 60, 10, 10);
	sprite("speedrunTimer").css("font-family", "Tahoma").css("background-color", "rgba(0, 0, 0, 0)").css("font-size", "20pt");

	// Player Sprite and Hitbox
	createSpriteInGroup(playerGroupName, playerData["spriteId"], playerData["animIdleLeft"], playerData["spriteWidth"], playerData["spriteHeight"], playerData["xPos"], playerData["yPos"]);
	createSpriteInGroup(playerGroupName, playerData["hitboxId"], playerData["animHitbox"], playerData["hitboxWidth"], playerData["hitboxHeight"], playerData["xPos"], playerData["yPos"]);

	// Background
	if (!spriteExists("backgroundImage")) createSpriteInGroup(backgroundGroupName, "backgroundImage", preloadedAssets["background"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT, 0, 0);

	// Create 2 waves: wave1 and wave2
	createSpriteInGroup(backgroundGroupName, "wave1", preloadedAssets["wave1"], PLAYGROUND_WIDTH * 5, PLAYGROUND_HEIGHT, 0, 0);
	createSpriteInGroup(backgroundGroupName, "wave2", preloadedAssets["wave2"], PLAYGROUND_WIDTH * 5, PLAYGROUND_HEIGHT, 0, 0);
};

const setupLevel = () => {
	// Remove old level
	levelBlocks.forEach((block) => { removeSprite(block["id"]); });
	levelBlocks = [];

	// Set up new level
	var data = levelData[levelNumber];
	if (gameState == "playingSpecial") data = specialLevelData;
	data.forEach(({ x, y, size }) => { newBlock(x, y, size); });

	// Special conditions for the boss fight!
	if (levelNumber == 6) {
		bossFightSetup();
	}
};
// *************************************************

// PLAYERLINKTOCODE (ctrl+f)
// playerAnimation, handleCollisions, playerMovement
const playerAnimation = () => {
	// Second sprite that follows the invisible hitbox for animations
	spriteSetXY("playerSprite", spriteGetX(playerData["hitboxId"]) - spriteGetWidth("playerSprite") / 3, spriteGetY(playerData["hitboxId"]) - spriteGetHeight(playerData["hitboxId"]) / 2 + 2);
	var colliding = playerData["groundColliding"];
	var speed = playerData["xSpeed"];
	if (colliding) { // On ground anims
		if (speed < 1 && speed > -1) {
			if (playerData["animState"] != "idle") {
				if (playerData["lastDirection"] == 1) {
					spriteSetAnimation(playerData["spriteId"], playerData["animIdleLeft"]);
				}
				else {
					spriteSetAnimation(playerData["spriteId"], playerData["animIdleRight"]);
				}
				playerData["animState"] = "idle";
			}
		}
		else if (speed > 1) {
			if (playerData["animState"] != "runRight") {
				spriteSetAnimation(playerData["spriteId"], playerData["animRunCycleRight"]);
				playerData["animState"] = "runRight";
			}
			playerData["lastDirection"] = 1;
		}
		else if (speed < -1) {
			if (playerData["animState"] != "runLeft") {
				spriteSetAnimation(playerData["spriteId"], playerData["animRunCycleLeft"]);
				playerData["animState"] = "runLeft";
			}
			playerData["lastDirection"] = -1;
		}
	}
	else {
		if (speed < 0.5 && speed > -0.5) {
			if (playerData["animState"] != "jumpStraight") {
				spriteSetAnimation(playerData["spriteId"], playerData["animJumpStraight"]);
				playerData["animState"] = "jumpStraight";
			}
		}
		else if (speed > 0.5) {
			if (playerData["animState"] != "jumpRight") {
				spriteSetAnimation(playerData["spriteId"], playerData["animJumpRight"]);
				playerData["animState"] = "jumpRight";
			}
		}
		else if (speed < -0.5) {
			if (playerData["animState"] != "jumpLeft") {
				spriteSetAnimation(playerData["spriteId"], playerData["animJumpLeft"]);
				playerData["animState"] = "jumpLeft";
			}
		}
	}
};

const handleCollisions = (collIndex, hitSprite) => {
	// See how the player is colliding
	var groundSprite = levelBlocks.find(sprite => sprite["id"] === spriteId(hitSprite));
	var collisionNormal = spriteHitDirection(groundSprite["id"], groundSprite["xPos"], groundSprite["yPos"], groundSprite["xSpeed"], groundSprite["ySpeed"], groundSprite["width"], groundSprite["height"], playerData["hitboxId"], playerData["xPos"], playerData["yPos"], playerData["xSpeed"], playerData["ySpeed"], playerData['hitboxWidth'], playerData["hitboxHeight"]);
	// Un-collide the player
	switch (true) {
		case collisionNormal["right"]:
			playerData["xSpeed"] = 0;
			var amountOverlap = (playerData["xPos"] + playerData["hitboxWidth"]) - groundSprite["xPos"];
			if (amountOverlap > 0)
				playerData["xPos"] -= amountOverlap;
			break;
		case collisionNormal["left"]:
			playerData["xSpeed"] = 0;
			amountOverlap = playerData["xPos"] - (groundSprite["xPos"] + groundSprite["width"]);
			if (amountOverlap < 0)
				playerData["xPos"] -= amountOverlap;
			break;
		case collisionNormal["down"]:
			playerData["groundColliding"] = true;
			playerData["ySpeed"] = 0;
			amountOverlap = (playerData["yPos"] + playerData["hitboxHeight"]) - groundSprite["yPos"];
			if (amountOverlap > 0)
				playerData["yPos"] -= amountOverlap;
			if (Math.abs(groundSprite["xSpeed"]) > 0)
				playerData["xPos"] += groundSprite["xSpeed"];
			if (Math.abs(groundSprite["ySpeed"]) > 0)
				playerData["ySpeed"] += groundSprite["ySpeed"];
			break;
		case collisionNormal["up"]:
			console.log("UP")
			playerData["groundColliding"] = false;
			playerData["ySpeed"] = 0;
			amountOverlap = playerData["yPos"] - (groundSprite["yPos"] + groundSprite["height"]);
			console.log(amountOverlap)
			if (amountOverlap > 0)
				console.log("Did thise!")
				playerData["yPos"] -= amountOverlap;
			break;
	}
};

const playerMovement = () => {
	// Tahoma is a CSS Web Safe Font!
	if (debug) sprite("debugShown").html(`Offset: ${xOffset} | Player X: ${playerData["xPos"].toPrecision(3)} | Player Y: ${playerData["yPos"].toPrecision(3)} | Player Y Speed: ${playerData["ySpeed"].toPrecision(3)} | Player X Speed: ${playerData["xSpeed"].toPrecision(3)}`).css("font-family", "Tahoma").css("background-color", "rgba(0, 0, 0, 0)");

	// The playerData["groundColliding"] will be false in air, true on ground - but not before these two lines!
	playerData["groundColliding"] = false;
	forEachSpriteGroupCollisionDo(playerData["hitboxId"], collisionGroupName, handleCollisions);

	// Bouncepads / trampolines 
	forEachSpriteGroupCollisionDo(playerData["hitboxId"], bounceGroupName, () => { playerData["ySpeed"] = -25; });

	// Keys: a = 65 and d = 68
	if (getKeyState(keyMap["right"])) playerData["xSpeed"] += 2.5;
	if (getKeyState(keyMap["left"])) playerData["xSpeed"] += -2.5;
	
	playerData["xSpeed"] *= 0.7;
	if (Math.abs(playerData["xSpeed"]) <= 0.001) playerData["xSpeed"] = 0;

	// If in air vs ground
	if (playerData["ySpeed"] < 100 && !playerData["groundColliding"]) {
		playerData["ySpeed"]++;
		if (playerData["coyoteCounter"] > 0) playerData["coyoteCounter"]--;
	} else {
		playerData["coyoteCounter"] = playerData["coyoteTime"];
	}

	// In case you don't know what coyote time is: The player can still jump a few frames after going over the edge of a platform.
	if (playerData["coyoteCounter"] > 0 && (getKeyState(keyMap["jump"]))) { // Keys: 87 = w
		playerData["coyoteCounter"] = 0;
		playerData["ySpeed"] = -15;
	}

	// Boost
	if (getKeyState(keyMap["boost"]) && Date.now() - playerData["boostCooldown"] > 1000) { // Keys: 32 = space
		if (playerData["xSpeed"]) { // Ingore if it's 0
			playerData["xSpeed"] = 40 * (playerData["xSpeed"] / Math.abs(playerData["xSpeed"])); // This just sets the speed to either -40 or 40
			playerData["ySpeed"] = -3;
			playerData["boostCooldown"] = Date.now();
		}
	}

	// Reset after falling into the void or touching an enemy
	var touchedEnemy = false;
	forEachSpriteGroupCollisionDo(playerData["hitboxId"], enemyGroupName, (collIndex, hitSprite) => {
		if (spriteId(hitSprite) == droneData["id"]) {
			var collisionNormal = spriteHitDirection(droneData["id"], droneData["xPos"], droneData["yPos"], droneData["xSpeed"], droneData["ySpeed"], droneData["width"], droneData["height"], playerData["hitboxId"], playerData["xPos"], playerData["yPos"], playerData["xSpeed"], playerData["ySpeed"], playerData['hitboxWidth'], playerData["hitboxHeight"]);
			if (collisionNormal["down"]) {
				playerData["ySpeed"] = -5;
				droneData["health"] -= 50;
				droneData["attackState"] = "return";
			} else if (collisionNormal["up"]) {
				touchedEnemy = true;
			}
		} else {
			touchedEnemy = true;
		}
	});

	// Death
	if (playerData["yPos"] > PLAYGROUND_HEIGHT + playerData["spriteHeight"] || touchedEnemy) {
		[playerData["ySpeed"], playerData["xSpeed"]] = [0, 0];
		[playerData["xPos"], playerData["yPos"]] = [spawnPoint[levelNumber][0], spawnPoint[levelNumber][1]];
		setupLevel();
		deaths++;
	}

	// Next level
	if (playerData["xPos"] > 1840) {
		if (gameState == "playingSpecial") gameState == "menu"
		levelNumber++;
		xOffset = 750;
		playerData["xPos"] = spawnPoint[levelNumber][0];
		setupLevel();
	}

	// Basic level constraint
	if (playerData["xPos"] < -740) playerData["xPos"] = -740;

	// Actually move the player
	playerData["xPos"] = playerData["xPos"] + playerData["xSpeed"];
	playerData["yPos"] = playerData["yPos"] + playerData["ySpeed"];
	spriteSetXY(playerData["hitboxId"], playerData["xPos"] + xOffset, playerData["yPos"] + yOffset);
};
// *************************************************

// DRONELINKTOCODE (ctrl+f)
// bossFightSetup, updateHealth, droneAI, droneMovement, droneSwoop, droneReturn
const bossFightSetup = () => {
	if (!spriteExists(droneData["id"])) {
		minX = 10;
		createRectInGroup(textGroupName, "healthBarMain", 52, 72, 540, 10, "#76B947", 0, 0, 0);
		createSpriteInGroup(enemyGroupName, droneData["id"], droneData["droneFly"], droneData["width"], droneData["height"], droneData["xPos"], droneData["yPos"]);
		spriteSetAnimation("overlaySprite", preloadedAssets["bossOverlay"]);
		createRectInGroup(textGroupName, "healthBarSecond", 50, 70, 544, 14, "#171717", 0, 0, 0);
		createRectInGroup(textGroupName, "healthBarBack", 52, 72, 540, 10, "#FF5C5C", 0, 0, 0);
		createTextSpriteInGroup(textGroupName, "bossBarText", 540, 50, 40, 40);
		sprite("bossBarText").css("font-family", "Tahoma").css("background-color", "rgba(0, 0, 0, 0)").css("font-size", "20pt").css("text-align", "center");
		sprite("bossBarText").html("Evil Inc: Dronie");
		createSpriteInGroup(uiGroupName, "bossControls", preloadedAssets["bossControls"], 307, 329, PLAYGROUND_WIDTH / 2 - 153, PLAYGROUND_HEIGHT / 2 - 163);
	}
	else {
		missiles.forEach(missile => { removeSprite(missile["id"]); });
		missiles = [];
		droneData["yPos"], droneData["xPos"] = 200, 200;
		spriteSetXY(droneData["id"], droneData["xPos"], droneData["yPos"]);
		droneData["health"] = 540;
		droneData["attackState"] = "passive";
		if (!spriteExists("bossControls"))
			createSpriteInGroup(uiGroupName, "bossControls", preloadedAssets["bossControls"], 307, 329, PLAYGROUND_WIDTH / 2 - 153, PLAYGROUND_HEIGHT / 2 - 163);
	}
};

const updateHealth = () => {
	let prevWidth = spriteGetWidth("healthBarMain");
	if (spriteExists("healthBarMain"))
		removeSprite("healthBarMain");
	prevWidth = lerp(prevWidth, droneData["health"], lerpFactor);
	createRectInGroup(textGroupName, "healthBarMain", 52, 72, prevWidth, 10, "#76B947", 0, 0, 0);
};

const droneAI = () => {
	// Die animation
	if (droneData["health"] <= 0) {
		$("#restartButton").css({
			opacity: 0.5,
			cursor: "not-allowed",
			pointerEvents: "none"
		});
		gameState = "ended";
		finalTime = Date.now() - startTime;
		waitTimer = Date.now();
		if (spriteExists("dronePredict")) removeSprite("dronePredict");
	}

	// Drone "AI" is done with states.
	if (droneData["attackState"] == "passive") {
		droneMovement();
		if (Math.random() > 0.2) droneData["attackState"] = "missiles";
		if (spriteExists("dronePredict")) removeSprite("dronePredict");
	} else if (droneData["attackState"] == "swoop") {
		if (Date.now() - droneData["timer"] > 2000) {
			droneSwoop();
		} else {
			if (Date.now() - droneData["timer"] < 1000) {
				droneData["targetX"] = playerData["xPos"];
				droneData["targetY"] = playerData["yPos"];
			}
			if (!spriteExists("dronePredict")) createSpriteInGroup(uiGroupName, "dronePredict", preloadedAssets["dronePredict"], 196, 53, droneData["targetX"], droneData["targetY"]);
			if (spriteExists("dronePredict")) spriteSetXY("dronePredict", droneData["targetX"] - droneData["width"] / 2 + xOffset, droneData["targetY"] - droneData["height"] / 2 + yOffset);
			droneMovement();
		}
	} else if (droneData["attackState"] == "missiles") {
		if (Math.random() > 0.8 && Date.now() - droneData["timer"] > 200) {
			spawnMissle(droneData["xPos"] + droneData["width"] / 2, droneData["yPos"] + 20);
			droneData["health"]--;
			droneData["timer"] = Date.now();
			if (Math.random() < 0.1) {
				droneData["timer"] = Date.now();
				droneData["attackState"] = "swoop";
			}
		}
		droneMovement();
		if (spriteExists("dronePredict")) removeSprite("dronePredict");
	} else if (droneData["attackState"] == "return") {
		droneReturn();
		if (spriteExists("dronePredict")) removeSprite("dronePredict");
	}

	// Drone health
	updateHealth();

	// Actually move the Drone
	droneData["xPos"] = droneData["xPos"] + droneData["xSpeed"];
	droneData["yPos"] = droneData["yPos"] + droneData["ySpeed"];
	spriteSetXY(droneData["id"], droneData["xPos"] + xOffset, droneData["yPos"] + yOffset);
};

const droneMovement = () => {
	const distToPlayer = playerData["xPos"] - droneData["xPos"] - droneData["width"] / 2;
	if (Math.abs(distToPlayer) > 10) {
		droneData["xSpeed"] += clamp(Math.abs(distToPlayer) / 25, 0, 25) * (distToPlayer / Math.abs(distToPlayer));
		droneData["xSpeed"] *= 0.7;
	}
	else {
		droneData["xSpeed"] *= 0.5;
	}
	spriteRotate(droneData["id"], clamp(droneData["xSpeed"] * 1.6, -50, 50));
	droneData["yPos"] = droneData["yAmplitude"] * Math.sin(Date.now() * 2 * Math.PI / droneData["yPeriod"]) + 125;
};

const droneSwoop = () => {
	if (spriteExists("dronePredict")) spriteSetXY("dronePredict", droneData["targetX"] - droneData["width"] / 2 + xOffset, droneData["targetY"] - droneData["height"] / 2 + yOffset);
	const distToTargetX = droneData["targetX"] - droneData["xPos"] - droneData["width"] / 2;
	const distToTargetY = droneData["targetY"] - droneData["yPos"] - droneData["height"] / 2;
	if (Math.abs(distToTargetX) > 10 || Math.abs(distToTargetY) > 10) {
		droneData["xSpeed"] += clamp(Math.abs(distToTargetX) / 25, 0, 25) * (distToTargetX / Math.abs(distToTargetX));
		droneData["xSpeed"] *= 0.7;
		droneData["ySpeed"] += clamp(Math.abs(distToTargetY) / 25, 0, 25) * (distToTargetY / Math.abs(distToTargetY));
		droneData["ySpeed"] *= 0.7;
		droneData["pauseOnGround"] = Date.now();
		if (spriteExists("dronePredict")) removeSprite("dronePredict");
	} else {
		droneData["xSpeed"] = 0;
		droneData["ySpeed"] = 0;
		if (Date.now() - droneData["pauseOnGround"] > 3000) {
			droneData["pauseOnGround"] = Date.now();
			droneData["attackState"] = "return";
		}
	}
	spriteRotate(droneData["id"], clamp(droneData["xSpeed"] * 1.6, -50, 50));
};

const droneReturn = () => {
	droneData["targetY"] = droneData["yAmplitude"] * Math.sin(Date.now() * 2 * Math.PI / droneData["yPeriod"]) + 125;
	const distToTargetY = droneData["targetY"] - droneData["yPos"] - droneData["height"] / 2;
	const distToPlayer = playerData["xPos"] - droneData["xPos"] - droneData["width"] / 2;
	if (Math.abs(distToPlayer) > 10) {
		droneData["xSpeed"] += clamp(Math.abs(distToPlayer) / 25, 0, 25) * (distToPlayer / Math.abs(distToPlayer));
		droneData["xSpeed"] *= 0.7;
	}
	else {
		droneData["xSpeed"] *= 0.5;
	}
	if (Math.abs(distToTargetY) > 10) {
		droneData["ySpeed"] += clamp(Math.abs(distToTargetY) / 25, 0, 25) * (distToTargetY / Math.abs(distToTargetY));
		droneData["ySpeed"] *= 0.7;
	}
	else {
		droneData["attackState"] = "missiles";
	}
	spriteRotate(droneData["id"], clamp(droneData["xSpeed"] * 1.6, -50, 50));
};
// *************************************************

// MOVELEVELLINKTOCODE (ctrl+f)
// moveBlocks, moveMissiles
let selectedDrag;
const moveBlocks = () => {
	for (let i = 0; i < levelBlocks.length; i++) {
		let currentBlock = levelBlocks[i];
		if (Math.abs(currentBlock["xSpeed"]) > 0) {
			currentBlock["xPos"] += currentBlock["xSpeed"];
			if (currentBlock["xPos"] <= currentBlock["minXPos"] || currentBlock["xPos"] >= currentBlock["maxXPos"]) currentBlock["xSpeed"] = -currentBlock["xSpeed"];
		}
		if (Math.abs(currentBlock["ySpeed"]) > 0) {
			currentBlock["yPos"] += currentBlock["ySpeed"];
			if (currentBlock["yPos"] < currentBlock["minYPos"] || currentBlock["yPos"] > currentBlock["maxYPos"]) currentBlock["ySpeed"] = -currentBlock["ySpeed"];
		}

		// This allows the player to drag blocks!
		if (gameState == "editLevel" && !firstClickOnLevel) {
			// Context menu for removing/editing blocks
			if (!mouseButtonPressed && mouseX < 640 && mouseY < 480 && mouseX >= spriteGetX(currentBlock["id"]) && mouseX <= spriteGetX(currentBlock["id"]) + currentBlock["width"] && mouseY >= spriteGetY(currentBlock["id"]) && mouseY <= spriteGetY(currentBlock["id"]) + currentBlock["height"] && getMouseButton3() && !spriteExists("contextMenuSprite")) {
				mouseButtonPressed = true;
				levelEditorContextMenu(currentBlock["id"], i);
				setTimeout(() => {
					mouseButtonPressed = false;
				}, 500);
			}

			// So that we can't drag blocks while editing a level
			if (spriteExists("contextMenuSprite")) return;

			// Check if the user is clicking and not dragging a block yet
			let filteredBlocks = levelBlocks.filter(dict => dict.hasOwnProperty('draggable') && dict.draggable === true);
			if (getMouseButton1() && filteredBlocks.length === 0) {
				if (mouseX >= spriteGetX(currentBlock["id"]) && mouseX <= spriteGetX(currentBlock["id"]) + currentBlock["width"] && mouseY >= spriteGetY(currentBlock["id"]) && mouseY <= spriteGetY(currentBlock["id"]) + currentBlock["height"]) {
					// If no block is already selected, it can pick this one!
					if (!selectedDrag) selectedDrag = currentBlock["id"];

					// Make sure the user can't drag more than one at a time
					if (selectedDrag != currentBlock["id"]) return;

					// Set this block to draggable
					currentBlock["draggable"] = true;
					
					// So the user can drag from where on the block was clicked, not just the top left
					if (!currentBlock["dragOffsetX"]) currentBlock["dragOffsetX"] = (750 - xOffset - (640 - mouseX) - 110) - currentBlock["xPos"];
					if (!currentBlock["dragOffsetY"]) currentBlock["dragOffsetY"] = mouseY - currentBlock["yPos"];
				}
			} else if (!getMouseButton1() && filteredBlocks.length === 1) {
				// Reset all drag properties
				currentBlock["draggable"] = false;
				currentBlock["dragOffsetX"] = 0;
				currentBlock["dragOffsetY"] = 0;
				selectedDrag = null;
			}
			
			// If the block is the one it's supposed to drag, move the block
			if (currentBlock["draggable"] && filteredBlocks.length === 1) {
				currentBlock["xPos"] = 750 - xOffset - (640 - mouseX) - 110 - currentBlock["dragOffsetX"];
				currentBlock["yPos"] = mouseY - currentBlock["dragOffsetY"];
			}
		}
		spriteSetXY(currentBlock["id"], currentBlock["xPos"] + xOffset, currentBlock["yPos"] + yOffset);
	}
	spriteSetXY("wave1", xOffset / 5 - PLAYGROUND_WIDTH, yOffset);
	spriteSetXY("wave2", xOffset / 10 - PLAYGROUND_WIDTH, yOffset);
};

const moveMissiles = () => {
	missiles.forEach(missile => {
		// And just move the missile as normal
		missile["xPos"] = missile["xPos"] + missile["xSpeed"];
		missile["yPos"] = missile["yPos"] + missile["ySpeed"];
		spriteSetXY(missile["id"], missile["xPos"] + xOffset, missile["yPos"] + yOffset);
		// Check if it hits a wall
		forEachSpriteGroupCollisionDo(missile["id"], "collisionGroup", () => {
			removeSprite(missile["id"]);
			const index = missiles.indexOf(missile);
			if (index > -1)
				missiles.splice(index, 1);
		});
	});
};
// *************************************************

// DRAWLINKTOCODE (ctrl+f)
const draw = () => {
	// Gamestates
	if (gameState == "playing" || gameState == "playingSpecial") {
		// Camera movement, Calculate the distance from the player to the center of the screen, and allow it to be edited by the arrow keys
		const playerDistToCenterX = spriteGetX(playerData["hitboxId"]) - PLAYGROUND_WIDTH / 2;
		scrollAmount = getKeyState(keyMap["screenLeft"]) ? ++scrollAmount : (getKeyState(keyMap["screenRight"]) ? --scrollAmount : 0);
		xOffset = lerp(xOffset, clamp(xOffset + -playerDistToCenterX + scrollAmount * 10, minX, maxX), lerpFactor);
		
		// Player
		playerMovement();
		playerAnimation();
		moveBlocks();
		
		// Specific Level stuff
		if (levelNumber == 6) {
			droneAI();
			moveMissiles();
			if (spriteExists("bossControls") && (getKeyState(keyMap["screenLeft"]) || getKeyState(keyMap["screenRight"]) || getKeyState(keyMap["right"]) || getKeyState(keyMap["left"]) || getKeyState(keyMap["jump"]) || getKeyState(keyMap["boost"]))) removeSprite("bossControls");
		}

		// Timer
		const elapsed = new Date(Date.now() - startTime - pausedTime);
		sprite("speedrunTimer").html(elapsed.toISOString().slice(11, -1));

		// How-to-play menu
		if (spriteExists("controls") && (getKeyState(keyMap["screenRight"]) || getKeyState(keyMap["screenLeft"]) || getKeyState(keyMap["restart"]) || getKeyState(keyMap["right"])
			|| getKeyState(keyMap["left"]) || getKeyState(keyMap["jump"]) || getKeyState(keyMap["boost"]))) {
			removeSprite("controls");
		}

		// Pause Menu
		if (getKeyState(keyMap["pause"])) {
			gameState = "paused";
			pausedTime = Date.now() - startTime;
			createSpriteInGroup(textGroupName, "pauseMenu", preloadedAssets["pauseMenu"], PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
		}

		if (getKeyState(keyMap["restart"])) {
			levelNumber = 1;
			startTime = Date.now();
			resetGameState();
			setupLevel()
		}
	}
	else if (gameState == "paused") {
		if (getMouseButton1()) {
			if (!specialLevelData) {
				gameState = "playing";
			} else {
				gameState = "playingSpecial";
			}
			removeSprite("pauseMenu");
			startTime = Date.now() - pausedTime;
			pausedTime = 0;
		}
	}
	else if (gameState == "menu") {
		mainMenu();
	}
	else if (gameState == "ended") {
		endOfGame();
	}
	else if (gameState == "final") {
		winScreen();
	} else if (gameState == "editLevel") {
		levelEditor();
	}
};