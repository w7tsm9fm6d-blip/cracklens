'use strict';
const $=id=>document.getElementById(id);
let selected=null,lastResult=null,objectURL=null,selectionVersion=0,busy=false,runtimeReady=false;
const percent=new Intl.NumberFormat('es-CO',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1});
function error(message){$('error').textContent=message;$('error').hidden=false;}
function clearResult(){lastResult=null;$('result').hidden=true;$('empty-result').hidden=false;$('status').textContent='En espera';}
function setBusy(value){busy=value;$('analyze').disabled=value||!selected||!runtimeReady;$('analyze').textContent=value?'Analizando…':'Analizar superficie ↗';document.querySelectorAll('.example, #reset, #photo').forEach(el=>el.disabled=value);}
CRACKLENS_ENGINE.then(()=>{runtimeReady=true;$('runtime-status').textContent='Modelo listo · OpenCV.js';if(!busy)$('analyze').disabled=!selected;}).catch(()=>{$('runtime-status').textContent='No se pudo iniciar el modelo';error('No se pudo iniciar OpenCV. Recarga la página en un navegador actualizado.');});
async function selectImage(blob,name){
 const ticket=++selectionVersion;$('error').hidden=true;clearResult();selected=null;$('analyze').disabled=true;
 try{
  if(!['image/jpeg','image/png','image/webp'].includes(blob.type))throw new Error('Selecciona una imagen JPG, PNG o WEBP.');
  if(blob.size>15*1024*1024)throw new Error('La imagen supera 15 MB. Usa una fotografía más pequeña.');
  const bitmap=await createImageBitmap(blob);
  if(ticket!==selectionVersion){bitmap.close();return;}
  if(bitmap.width*bitmap.height>24000000){bitmap.close();throw new Error('La imagen es demasiado grande. Usa una foto de hasta 24 megapíxeles.');}
  if(bitmap.width<64||bitmap.height<64){bitmap.close();throw new Error('Usa una imagen de al menos 64 × 64 píxeles.');}
  if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(blob);$('preview').src=objectURL;$('preview').hidden=false;$('upload-prompt').hidden=true;$('image-caption').hidden=false;$('image-caption').textContent=`${name} · ${bitmap.width} × ${bitmap.height} px`;
  selected={blob,name,width:bitmap.width,height:bitmap.height};bitmap.close();$('analyze').disabled=!runtimeReady;$('reset').hidden=false;
 }catch(e){if(ticket===selectionVersion){error(e.message||'No se pudo abrir la imagen. Intenta con otra fotografía.');$('preview').hidden=true;$('upload-prompt').hidden=false;$('image-caption').hidden=true;}}
}
$('photo').addEventListener('change',e=>{if(e.target.files[0])selectImage(e.target.files[0],e.target.files[0].name);});
for(const type of ['dragenter','dragover'])$('dropzone').addEventListener(type,e=>{e.preventDefault();if(!busy)$('dropzone').classList.add('dragover');});
for(const type of ['dragleave','drop'])$('dropzone').addEventListener(type,e=>{e.preventDefault();$('dropzone').classList.remove('dragover');});
$('dropzone').addEventListener('drop',e=>{if(!busy&&e.dataTransfer.files[0])selectImage(e.dataTransfer.files[0],e.dataTransfer.files[0].name);});
$('reset').addEventListener('click',()=>{$('photo').click();});
document.querySelectorAll('.example').forEach(button=>button.addEventListener('click',async()=>{
 try{const response=await fetch(button.dataset.example);if(!response.ok)throw new Error('No se pudo abrir el ejemplo.');await selectImage(await response.blob(),button.dataset.example);}
 catch(e){error(e.message);}
}));
$('analyze').addEventListener('click',async()=>{
 if(!selected||busy)return;setBusy(true);$('error').hidden=true;$('status').textContent='Analizando';
 try{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const bitmap=await createImageBitmap(selected.blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,0,0);bitmap.close();
  const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
  const gray=CrackLens.fromRGBA(rgba,canvas.width,canvas.height),feature=CrackLens.features(gray),engine=await CRACKLENS_ENGINE,score=engine.predict(feature);
  const cracked=score>=.5;
  $('empty-result').hidden=true;$('result').hidden=false;$('status').textContent='Análisis completo';$('result-label').textContent=cracked?'Grieta detectada':'Sin grieta detectada';
  $('result-description').textContent=cracked?'La imagen presenta patrones que el modelo asocia con una grieta superficial. Revisa el área fotografiada.':'El modelo clasifica esta imagen en la categoría sin grieta. Revisa también la superficie y las condiciones de captura.';
  $('score-text').textContent=percent.format(score);$('score-fill').style.width=`${score*100}%`;
  lastResult={proyecto:'CrackLens',integrantes:['JUAN MANUEL ESCALANTE ACEVEDO','JUAN SEBASTIAN VELEZ BARONA'],motor:engine.name,archivo:selected.name,fecha:new Date().toISOString(),clasificacion:cracked?'grieta':'sin_grieta',puntuacion_grieta:score,umbral:.5,nota:'Puntuación no calibrada. Prototipo académico; no determina seguridad ni gravedad estructural.'};
 }catch(e){error('No se pudo analizar la imagen. Prueba otra fotografía.');$('status').textContent='Error de análisis';}
 finally{setBusy(false);}
});
$('download').addEventListener('click',()=>{if(!lastResult)return;const blob=new Blob([JSON.stringify(lastResult,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='resultado-cracklens.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
