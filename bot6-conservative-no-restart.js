var config={baseBet:{label:"Base Bet Amount",value:0,type:"number"},dummy:{label:"Config Active",value:1,type:"number"},targetPercentage:{label:"Target Profit %",value:3,type:"number"}};
/*
 INSTRUCTIONS:
 1. This bot uses CONSERVATIVE recovery with lower payout (1.2x) for easier wins.
 2. Recovery system survives up to 15 consecutive losses with gentle escalation.
 3. Normal payout: 1.2x (easier to win), Recovery payout: 1.2x.
 4. Recovery clears in 3 winning rounds per loss (safer, slower recovery).
 5. Lower recoveryStepInc (0.15) prevents bet escalation from maxing out capital.
 6. The bot will automatically send an email report when the target is reached.
 7. Wait for Game: Automatically waits for the next round if started mid-game.
 8. Base bet can be set in config (0 means auto-calculate based on balance).
 9. Target Percentage: Set targetPercentage to your desired profit % (e.g., 1 for 1%, 3 for 3%).
*/
function main(startBal){
var normalPayout=1.2,recoveryPayout=1.2,recoveryWinTarget=3,recoveryRoundsPerLoss=3,recoveryStepInc=0.15,maxLosses=15,notifyEnabled=1,webhook="https://script.google.com/macros/s/AKfycbyQC3B85Mhk1GFCNo4fd9HIawRlnWe8ALOTKez4zF8Q--6Rr7H_J8YEA6dPsTIoKgKq_w/exec";
if(game.status&&game.status.toLowerCase().indexOf("running")!==-1){log.info("⏳ Round in progress. Waiting for next round...");game.on("GAME_STARTING",function ready(){game.removeListener("GAME_STARTING",ready);main(startBal);});return;}
startBal=(startBal&&startBal>0)?startBal:currency.amount;
var targetPercentConfig=config&&config.targetPercentage&&config.targetPercentage.value?config.targetPercentage.value:3;
var targetProfit=Number((startBal*(targetPercentConfig/100)).toFixed(8));
var sumLossesMultiplier=Math.pow(2,maxLosses)-1,maxStep=maxLosses+(recoveryRoundsPerLoss*maxLosses),maxBetMultiplier=1+recoveryStepInc*maxStep,safety=2.0;// maxStakeCap=startBal*0.8;
var configBaseBet=config&&config.baseBet&&config.baseBet.value?config.baseBet.value:0;
var baseByLossSum=Math.floor(startBal/(sumLossesMultiplier*safety));// baseByMaxBet=Math.floor(maxStakeCap/(maxBetMultiplier*safety));
var autoBase=Math.max(currency.minAmount,baseByLossSum);// Math.min(baseByLossSum,baseByMaxBet));
var base=configBaseBet>0?Math.max(currency.minAmount,configBaseBet):autoBase;
var bet=base,payout=normalPayout,wins=0,losses=0,winStreak=0,lossStreak=0,recoveryRemaining=0,recoveryWinsLeft=0,currentCalcBal=startBal,paused=0,didOnBet=0,roundDelayTimer=null,delayMs=1000,isBetting=0;
log.info("🚀 Bot Started");log.info("Start Balance: "+startBal);log.info("Target: "+targetProfit.toFixed(8)+" ("+targetPercentConfig+"%)");log.info("Base Bet: "+base.toFixed(8)+(configBaseBet>0?" (User Set)":" (Auto)"));
function nextRecoveryBet(){var denom=recoveryPayout-1,wl=recoveryWinsLeft>0?recoveryWinsLeft:1;var needed=recoveryRemaining/(denom*wl);var b=Math.ceil(needed);if(b<base)b=base;if(b<currency.minAmount)b=currency.minAmount;return b;}
function getTS(){var d=new Date(),utc=d.getTime()+(d.getTimezoneOffset()*60000),nd=new Date(utc+(3600000*1)),h=nd.getHours(),m=nd.getMinutes(),s=nd.getSeconds(),y=nd.getFullYear(),mo=nd.getMonth()+1,da=nd.getDate(),f=function(n){return n<10?"0"+n:n};return f(h)+":"+f(m)+":"+f(s)+" || "+y+"-"+f(mo)+"-"+f(da);}
function pauseSession(status){if(paused)return;paused=1;var currentProfit=currentCalcBal-startBal;log.info("🎯 Target Reached! Sending email...");
if(notifyEnabled&&webhook){var total=wins+losses,payload={startBalance:startBal,endBalance:currentCalcBal,profit:currentProfit,target:targetProfit,wins:wins,losses:losses,winRate:total>0?((wins/total)*100).toFixed(2):null,timestamp:getTS(),status:status||"TARGET_REACHED_RESTART"};
if(typeof fetch==="function"){fetch(webhook,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}).then(function(){log.info("📧 Email sent. Bot stopped at target.");}).catch(function(e){log.error("Notify error: "+(e&&e.message?e.message:e));});}else{}}else{}}
game.onBet=function(){if(paused||isBetting)return;didOnBet=1;try{
if(roundDelayTimer){try{clearTimeout(roundDelayTimer);}catch(_){ } roundDelayTimer=null;}
roundDelayTimer=setTimeout(function(){
try{
if(paused||isBetting)return;
var status=(game.status||"").toLowerCase();
if(status==="running"){log.info("⏳ Game is running; skipping late bet to avoid suspension.");return;}
if(bet>currentCalcBal){log.error("🛑 Insufficient balance. Stopping...");return stopGame();}
isBetting=1;
game.bet(bet,payout).then(function(res){isBetting=0;handleBetResult(res);}).catch(function(err){isBetting=0;var eStr=(err&&err.message)?err.message:(err||"Unknown error");var msg=eStr.toLowerCase();
if(msg.indexOf("bet suspended")!==-1||msg.indexOf("game has started")!==-1){log.info("⏳ Bet missed (game started during 1s delay). Waiting for next round...");}else{handleBetError(err);}});}catch(e){isBetting=0;log.error("💥 Critical Error in delayed bet: "+(e.message||e));}
roundDelayTimer=null;
},delayMs);
}catch(e){log.error("💥 Critical Error in onBet: "+(e.message||e));}};
function handleBetResult(payoutResult){if(payoutResult>1){var profit=(bet*payoutResult)-bet;currentCalcBal+=profit;wins++;winStreak++;lossStreak=0;
if(recoveryRemaining>0){recoveryRemaining=Math.max(0,recoveryRemaining-profit);if(recoveryRemaining<=0){recoveryWinsLeft=0;payout=normalPayout;bet=base;log.info("🟢 Recovery done.");}else{recoveryWinsLeft=Math.max(1,recoveryWinsLeft-1);payout=recoveryPayout;bet=nextRecoveryBet();}}
else{payout=normalPayout;bet=base;}}else{currentCalcBal-=bet;losses++;lossStreak++;winStreak=0;recoveryRemaining+=bet;recoveryWinsLeft=recoveryWinTarget;payout=recoveryPayout;bet=nextRecoveryBet();log.info("🟠 Loss. Recovery wins left: "+recoveryWinsLeft);if(lossStreak>=maxLosses){log.error("🛑 Max losses. Stopping...");return stopGame();}}
if(!paused&&(currentCalcBal-startBal)>=targetProfit)return pauseSession("TARGET_REACHED_STOP");
log.info("💰 Balance: "+currentCalcBal.toFixed(8)+" | Profit: "+(currentCalcBal-startBal).toFixed(8)+" / "+targetProfit.toFixed(8));}
function handleBetError(err){var eStr=(err&&err.message)?err.message:(err||"Unknown error");log.error("💥 Bet Error: "+eStr);log.info("⏳ Keeping state and waiting for next round...");}
function stopGame(){var finalProfit=currency.amount-startBal;log.info("📊 ==== FINAL STATS ====");log.info("Start: "+startBal+" | End: "+currency.amount);log.info("Profit: "+finalProfit.toFixed(8));
if(notifyEnabled&&webhook){var total=wins+losses,payload={startBalance:startBal,endBalance:currency.amount,profit:finalProfit,target:targetProfit,wins:wins,losses:losses,winRate:total>0?((wins/total)*100).toFixed(2):null,timestamp:getTS(),status:"STOPPED_RESTART"};
if(typeof fetch==="function"){fetch(webhook,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}).then(function(){log.info("📧 Email sent. Bot stopped.");}).catch(function(e){log.error("Notify error: "+(e&&e.message?e.message:e));});}else{}}else{}}}