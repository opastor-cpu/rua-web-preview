// The only entrance is five consecutive activations of the large Ecoferia photo.
const trigger = document.querySelector('[data-ocean-trigger]');
if (trigger) {
  let count = 0, lastTap = 0, clearSequence;
  let dialog, canvas, ctx, engine, art, musicModule, music, state, loading, frame, lastFrame = 0;
  let rewardHandled = false, rewardTimer, rewardRemaining = 5, beforeReward = 'running';
  let ambientTime = 0, milestone = 0, audioContext, effectsGain, openEpoch = 0;
  const CAMPAIGN = 'https://c.org/5d7dsFx5yr';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'rua:ocean:best';
  const read = name => { try { return localStorage.getItem(name); } catch { return null; } };
  const save = (name, value) => { try { localStorage.setItem(name, String(value)); } catch { /* Optional. */ } };
  let muted = read('rua:ocean:muted') === '1' || (read('rua:ocean:muted') === null && read('rua:interaction-sound-muted') === '1');
  const $ = selector => dialog.querySelector(selector);

  function ensureAudio() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio || muted) return null;
      audioContext ||= new Audio();
      if (!effectsGain) { effectsGain=audioContext.createGain(); effectsGain.connect(audioContext.destination); }
      effectsGain.gain.setValueAtTime(1,audioContext.currentTime);
      if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
      return audioContext;
    } catch { return null; }
  }
  function stopMusic() { music?.stop(); }
  function syncMusic() {
    if(!dialog?.open||state?.status!=='running'||muted){stopMusic();return;}
    const audio=ensureAudio();
    if(!audio||!musicModule)return;
    try { music ||= musicModule.createOceanMusic(audio); music.start(); } catch { /* Music is optional. */ }
  }
  function sound(kind) {
    if (!ensureAudio()) return;
    try {
      const notes = {jump:[[680,0,.08],[920,.045,.08]],hit:[[180,0,.12],[110,.08,.13]],point:[[960,0,.05],[1200,.07,.07]],start:[[520,0,.06],[690,.07,.06],[1040,.14,.1]],reward:[[520,0,.1],[660,.12,.1],[790,.24,.1],[1050,.36,.2]]}[kind] || [];
      notes.forEach(([frequency,delay,duration]) => {
        const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
        const t=audioContext.currentTime+delay;
        oscillator.type=kind==='hit'?'triangle':'square';
        oscillator.frequency.setValueAtTime(frequency,t);
        gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(kind==='hit'?.035:.018,t+.008);
        gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
        oscillator.connect(gain);gain.connect(effectsGain);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
        oscillator.start(t);oscillator.stop(t+duration+.01);
      });
    } catch { /* Sound never blocks the game. */ }
  }

  function createDialog() {
    dialog=document.createElement('dialog');dialog.id='ocean-game';dialog.className='ocean-dialog';
    dialog.setAttribute('aria-labelledby','ocean-title');
    dialog.innerHTML=`<header class="ocean-header"><div><span class="ocean-kicker">RUA / UN SECRETO FRENTE AL MAR</span><h2 class="ocean-title" id="ocean-title">Lucianita y el océano</h2></div><button class="ocean-close" type="button" data-game-close aria-label="Cerrar minijuego">×</button></header><div class="ocean-scoreboard"><span>UN OCÉANO. MUCHAS VIDAS.</span><div class="ocean-scores"><span>PUNTOS <strong data-game-score>00000</strong></span><span>RÉCORD <strong data-game-best>00000</strong></span></div></div><div class="ocean-stage"><canvas class="ocean-canvas" width="800" height="360" tabindex="0" aria-label="Lucianita corre por la playa. Espacio o flecha arriba para saltar; mantén flecha abajo para agacharte. P para pausar.">Tu navegador necesita admitir Canvas para mostrar el minijuego.</canvas><div class="ocean-panel" data-game-panel><div class="ocean-panel-card"><div class="ocean-panel-tag" data-panel-tag>DESCUBRISTE UN SECRETO</div><h3 data-panel-title>Ayuda a Lucianita a salvar el océano</h3><p data-panel-copy>Salta barriles y residuos. Agáchate bajo los aviones. Cada paso cuenta.</p><button class="ocean-play" type="button" data-game-play disabled>Preparando la playa…</button><a class="ocean-reward-link" href="${CAMPAIGN}" data-game-reward hidden>Ir a la campaña</a><button class="ocean-secondary" type="button" data-game-continue hidden>Seguir jugando</button></div></div></div><div class="ocean-touch-controls"><button type="button" data-game-duck aria-label="Mantener para agacharse">↓ Agacharse</button><button type="button" data-game-jump>↑ Saltar</button></div><div class="ocean-tools"><p><kbd>Espacio / ↑</kbd> saltar · <kbd>↓</kbd> agacharse · <kbd>P</kbd> pausa<br>En celular: toca la playa para saltar o usa los botones.</p><div class="ocean-settings"><button type="button" data-game-pause disabled>Pausar</button><button type="button" data-game-mute aria-pressed="${!muted}">${muted?'Sonido: no':'Sonido: sí'}</button></div></div><div class="ocean-goal"><span>Meta especial: 1.000 puntos</span><progress max="1000" value="0" aria-label="Progreso hacia la recompensa"></progress></div><p class="sr-only" data-game-announcement aria-live="polite"></p>`;
    document.body.append(dialog);canvas=$('canvas');ctx=canvas.getContext('2d');
    $('[data-game-close]').addEventListener('click',closeGame);
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeGame();});
    dialog.addEventListener('close',cleanup);
    $('[data-game-play]').addEventListener('click',()=>state?.status==='paused'?resume():start());
    $('[data-game-pause]').addEventListener('click',()=>state?.status==='running'?pause():resume());
    $('[data-game-mute]').addEventListener('click',()=>{
      muted=!muted;save('rua:ocean:muted',muted?'1':'0');
      $('[data-game-mute]').setAttribute('aria-pressed',String(!muted));
      $('[data-game-mute]').textContent=muted?'Sonido: no':'Sonido: sí';
      if(muted)effectsGain?.gain.setValueAtTime(0,audioContext.currentTime);
      else sound('point');
      syncMusic();
    });
    $('[data-game-continue]').addEventListener('click',()=>{
      clearTimeout(rewardTimer);rewardTimer=null;
      if(beforeReward==='gameover'){start();return;}
      state.status='paused';$('[data-game-reward]').hidden=true;$('[data-game-continue]').hidden=true;$('[data-game-pause]').disabled=false;resume();
    });
    $('[data-game-reward]').addEventListener('click',()=>clearTimeout(rewardTimer));
    canvas.addEventListener('pointerdown',event=>{event.preventDefault();canvas.focus({preventScroll:true});doJump();});
    const jumpButton=$('[data-game-jump]'),duckButton=$('[data-game-duck]');
    jumpButton.addEventListener('pointerdown',event=>{event.preventDefault();doJump();});
    jumpButton.addEventListener('click',event=>{if(event.detail===0)doJump();});
    duckButton.addEventListener('pointerdown',event=>{
      event.preventDefault();if(state?.status!=='running')return;
      duckButton.setPointerCapture(event.pointerId);engine.setDucking(state,true);duckButton.classList.add('is-held');
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture'])duckButton.addEventListener(name,releaseDuck);
    duckButton.addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();if(state?.status==='running'){engine.setDucking(state,true);duckButton.classList.add('is-held');}}});
    duckButton.addEventListener('keyup',event=>{if([' ','Enter'].includes(event.key))releaseDuck();});
    dialog.addEventListener('keydown',event=>{
      if(event.altKey||event.ctrlKey||event.metaKey||!state)return;
      const onControl=event.target.closest('button,a');
      if(['ArrowUp','ArrowDown',' ','w','W','s','S','p','P'].includes(event.key)){
        if(onControl&&[' ','Enter'].includes(event.key))return;
        event.preventDefault();
      }
      if(event.repeat)return;
      if(['ArrowUp',' ','w','W'].includes(event.key))doJump();
      else if(['ArrowDown','s','S'].includes(event.key)&&state.status==='running')engine.setDucking(state,true);
      else if(['p','P'].includes(event.key)){if(state.status==='running')pause();else if(state.status==='paused'&&!rewardTimer)resume();}
    });
    dialog.addEventListener('keyup',event=>{if(['ArrowDown','s','S'].includes(event.key)){event.preventDefault();releaseDuck();}});
    window.addEventListener('blur',()=>{if(dialog.open){releaseDuck();if(state?.status==='running')pause();stopRewardCountdown();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open){if(state?.status==='running')pause();stopRewardCountdown();}});
    window.addEventListener('resize',()=>{if(dialog.open){if(state?.status==='running')pause();sizeCanvas();}});
  }

  function releaseDuck(){if(state)engine.setDucking(state,false);$('[data-game-duck]')?.classList.remove('is-held');}
  function sizeCanvas(){const width=window.innerWidth<360?400:window.innerWidth<620?480:800;canvas.width=width;canvas.height=360;if(state)state.worldWidth=width;ctx.imageSmoothingEnabled=false;}
  function announce(text){$('[data-game-announcement]').textContent=text;}
  function panel(tag,title,copy,button){
    $('[data-game-panel]').hidden=false;$('[data-panel-tag]').textContent=tag;$('[data-panel-title]').textContent=title;$('[data-panel-copy]').textContent=copy;
    $('[data-game-play]').hidden=false;$('[data-game-play]').textContent=button;$('[data-game-play]').disabled=false;
    $('[data-game-reward]').hidden=true;$('[data-game-continue]').hidden=true;
  }
  function updateScores(){
    $('[data-game-score]').textContent=String(state.score).padStart(5,'0');
    $('[data-game-best]').textContent=String(state.best).padStart(5,'0');
    $('progress').value=Math.min(state.score,engine.GOAL_SCORE);
    dialog.dataset.gameStatus=state.status;
  }
  function start(){
    if(!state)return;clearTimeout(rewardTimer);rewardTimer=null;engine.resetGame(state);engine.startGame(state);
    rewardHandled=false;milestone=0;$('[data-game-reward]').hidden=true;$('[data-game-continue]').hidden=true;$('[data-game-panel]').hidden=true;$('[data-game-pause]').disabled=false;$('[data-game-pause]').textContent='Pausar';
    releaseDuck();lastFrame=0;canvas.focus({preventScroll:true});sound('start');syncMusic();announce('¡Vamos, Lucianita! Salta los obstáculos y agáchate bajo los aviones.');updateScores();
  }
  function doJump(){
    if(!state||rewardTimer||(!$('[data-game-reward]').hidden))return;
    if(state.status==='ready'||state.status==='gameover'){start();return;}
    if(state.status==='paused'){resume();return;}
    if(engine.jump(state))sound('jump');
  }
  function pause(){
    if(!state||state.status!=='running')return;
    state.status='paused';stopMusic();releaseDuck();panel('TÓMATE UN RESPIRO','El océano te espera','Tu carrera está en pausa. Vuelve cuando quieras.','Continuar');
    $('[data-game-pause]').textContent='Continuar';announce('Juego en pausa.');updateScores();
  }
  function resume(){
    if(!state||state.status!=='paused'||!$('[data-game-reward]').hidden)return;
    state.status='running';lastFrame=0;$('[data-game-panel]').hidden=true;$('[data-game-pause]').textContent='Pausar';canvas.focus({preventScroll:true});syncMusic();updateScores();
  }
  function gameover(){
    stopMusic();releaseDuck();save(key,state.best);sound('hit');$('[data-game-pause]').disabled=true;
    panel('OTRA OLA. OTRA OPORTUNIDAD.','¡Vamos de nuevo!',`Conseguiste ${state.score} puntos. Salta los barriles y residuos; agáchate cuando pase un avión bajo.`,'Volver a correr');
    announce(`Fin de la carrera. ${state.score} puntos. Tu récord es ${state.best}.`);
  }
  function reward(){
    rewardHandled=true;beforeReward=state.status;state.status='paused';stopMusic();releaseDuck();save(key,state.best);sound('reward');
    panel('1.000 PUNTOS · META DESBLOQUEADA','Tu carrera llega más lejos','Abriremos la campaña del Tratado de Altamar en 5 segundos.','');
    $('[data-game-play]').hidden=true;$('[data-game-reward]').hidden=false;$('[data-game-continue]').hidden=false;$('[data-game-pause]').disabled=true;
    $('[data-game-continue]').focus({preventScroll:true});announce('¡Mil puntos! Desbloqueaste la campaña. Puedes visitarla o seguir jugando.');
    rewardRemaining=5;const tick=()=>{
      if(!dialog.open||document.hidden){stopRewardCountdown();return;}
      rewardRemaining--;
      if(rewardRemaining<=0){rewardTimer=null;window.location.assign(CAMPAIGN);return;}
      $('[data-panel-copy]').textContent=`Abriremos la campaña del Tratado de Altamar en ${rewardRemaining} segundos.`;
      rewardTimer=setTimeout(tick,1000);
    };rewardTimer=setTimeout(tick,1000);updateScores();
  }
  function stopRewardCountdown(){
    if(!rewardTimer)return;clearTimeout(rewardTimer);rewardTimer=null;
    $('[data-panel-copy]').textContent='Campaña desbloqueada. Puedes visitarla o continuar tu carrera.';
  }
  function draw(now){
    if(!dialog.open||!state)return;
    const dt=lastFrame?Math.min((now-lastFrame)/1000,1/30):0;lastFrame=now;
    if(!reduced.matches&&state.status!=='paused')ambientTime+=dt;
    const previous=state.status;engine.updateGame(state,dt);
    if(previous==='running'&&state.status==='gameover')gameover();
    if(state.rewardEarned&&!rewardHandled)reward();
    if(state.status==='running'&&Math.floor(state.score/100)>milestone){milestone=Math.floor(state.score/100);sound('point');}
    ctx.clearRect(0,0,canvas.width,canvas.height);
    art.drawScene(ctx,{time:ambientTime,distance:state.distance,score:state.score,width:canvas.width,height:360,reducedMotion:reduced.matches});
    state.obstacles.forEach(obstacle=>art.drawObstacle(ctx,obstacle,state.time));
    art.drawRunner(ctx,{...state.player,running:state.status==='running',time:state.time});
    updateScores();frame=requestAnimationFrame(draw);
  }
  function cleanup(){
    openEpoch++;
    cancelAnimationFrame(frame);clearTimeout(rewardTimer);rewardTimer=null;lastFrame=0;
    music?.dispose();music=null;
    effectsGain?.gain.setValueAtTime(0,audioContext.currentTime);
    if(state){save(key,state.best);releaseDuck();if(state.status==='running')state.status='paused';}
    document.body.classList.remove('ocean-open');trigger.focus({preventScroll:true});
  }
  function closeGame(){dialog.close();}
  async function openGame(){
    if(!dialog)createDialog();if(dialog.open)return;
    const openId=++openEpoch;
    dialog.showModal();document.body.classList.add('ocean-open');
    try{
      loading ||= Promise.all([import('./ocean-engine.mjs?v=7'),import('./ocean-art.js?v=8'),import('./ocean-music.mjs?v=7')]);
      [engine,art,musicModule]=await loading;
      if(!dialog.open||openId!==openEpoch)return;
      if(!ctx)throw new Error('Canvas unavailable');
      state=engine.createGame();state.best=Math.max(0,Math.floor(Number(read(key))||0));rewardHandled=false;
      ambientTime=0;sizeCanvas();lastFrame=0;
      panel('DESCUBRISTE UN SECRETO','Ayuda a Lucianita a salvar el océano','Salta barriles y residuos. Agáchate bajo los aviones. La playa te necesita.','¡A correr!');
      $('[data-game-pause]').disabled=true;$('[data-game-play]').focus({preventScroll:true});
      announce('Descubriste el minijuego: ayuda a Lucianita a salvar el océano.');frame=requestAnimationFrame(draw);
    }catch{
      if(!dialog.open||openId!==openEpoch)return;
      loading=null;panel('VOLVAMOS A INTENTARLO','La playa está por llegar','No se pudo cargar el juego. Cierra esta ventana y toca la foto cinco veces para intentarlo de nuevo.','');$('[data-game-play]').hidden=true;
    }
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-ocean-trigger]')){count=0;clearTimeout(clearSequence);return;}
    const now=performance.now();count=now-lastTap<=1200?count+1:1;lastTap=now;
    clearTimeout(clearSequence);clearSequence=setTimeout(()=>{count=0;},1200);
    if(count===5){count=0;clearTimeout(clearSequence);void openGame();}
  });
}
