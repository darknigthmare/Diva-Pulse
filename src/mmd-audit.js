/* V21 model diagnostics. Importability is not a claim of pixel-perfect fidelity. */
(function(root){'use strict';
const K=root.PulseMMDCompat;
function auditModel(m,name,files=[]){
 const blockers=[],warnings=[];try{K.validateModel(m);}catch(e){blockers.push(e.message);}
 const types=Array.from({length:5},(_,type)=>Array.from(m.weightTypes||[]).filter(t=>t===type).length);
 if(types[3])warnings.push(types[3]+' sommets SDEF : déformation sphérique active, à contrôler sur ce modèle.');if(types[4])warnings.push(types[4]+' sommets QDEF : quaternions duaux actifs, à contrôler sur ce modèle.');
 const grants=m.bones.filter(b=>b.grant).length,limited=m.bones.filter(b=>b.ik?.links?.some(l=>l.limited)).length;
 if(grants)warnings.push(grants+' os à héritage : append standard actif ; héritage local/monde et interactions après IK/physique non exhaustifs.');if(limited)warnings.push(limited+' chaînes IK à limites XYZ actives, jusqu’à 32 itérations ; fidélité complète non certifiée.');
 const unsupported=[...new Set(m.morphs.filter(x=>![0,1,2,3,8].includes(x.type)).map(x=>x.type))];if(unsupported.length)warnings.push('Morphs UV supplémentaires/flip/impulsions non appliqués (types '+unsupported.join(', ')+').');
 const physics=root.PulseSecondaryPhysics?.inspect(m.physics);if(physics?.bodies)warnings.push(physics.bodies+' corps physiques lus : dynamique secondaire optionnelle, pas Bullet. '+physics.warnings.join(' '));if(m.physics?.trailingBytes)warnings.push('Données finales non interprétées : '+m.physics.trailingBytes+' octets.');
 const tex=m.textures.map(path=>{const r=K.resolveTexture(files,name,path);return {path,resolved:r.file?.name||null,warning:r.warning||null,decodeError:r.file?.decodeError||null};});
 for(const t of tex)if(t.warning)warnings.push(t.warning);else if(t.decodeError)warnings.push('Texture illisible : '+t.path+' — '+t.decodeError);
 if(m.morphs.some(x=>x.type===8))warnings.push('Morphs matériau partiels : diffuse RGBA, texture/sphère actives ; specular, ambient, contours et toon non appliqués.');const boneNames=m.bones.map(b=>b.name),morphNames=m.morphs.filter(x=>[0,1,2,3,8].includes(x.type)).map(b=>b.name);
 const procedural=root.PulseAutoShow?.proceduralMotion(m.bones,'wave',.5).matchedBones||0;
 if(!procedural)warnings.push('Squelette non reconnu pour la danse automatique : pose statique sans VMD adapté.');
 const compatibleMotions=files.filter(f=>f.kind==='vmd'&&f.info?.motionFeatures).map(f=>{const names=f.info.motionFeatures.boneNames||[],matched=names.filter(n=>boneNames.includes(n));const facial=f.info.motionFeatures.morphNames||[];return {name:f.name,matched:matched.length,total:names.length,matchedMorphs:facial.filter(n=>morphNames.includes(n)).length,totalMorphs:facial.length,ratio:names.length?matched.length/names.length:0};});
 if(compatibleMotions.length&&!compatibleMotions.some(m=>m.matched>0||m.matchedMorphs>0))warnings.push('Aucun nom d’os commun aux VMD du pack. Les motions ne sont pas reciblées automatiquement.');
 const missingTextures=tex.filter(t=>!t.resolved||t.decodeError).length;
 return {name,physics,format:m.kind.toUpperCase(),status:blockers.length?'blocked':warnings.length?'partial':'importable',blockers,warnings,textures:tex,missingTextures,compatibleMotions,stats:{vertices:m.vertexCount,triangles:m.indices.length/3,bones:m.bones.length,materials:m.materials.length,morphs:m.morphs.length,skinTypes:types,proceduralBones:procedural,estimatedGeometryBytes:m.vertexCount*64+m.indices.length*4},boneNames,morphNames};
}
function selectedReport(report,chosen){const names=new Set(chosen),models=report.models.filter(m=>names.has(m.name));if(!models.length)throw Error('Choisir au moins un modèle importable.');if(models.length>4)throw Error('Choisir quatre modèles maximum pour la troupe.');for(const m of models)if(m.blockers.length)throw Error(m.name+' : '+m.blockers.join(' '));return models;}
function attachDefault(song,source){
 if(!source?.scene?.mmd?.assetIds?.length||song.builtin||song.scene?.mmd||song.scene?.mmdDirector||song.scene?.modelAsset||song.scene?.events?.length)return song;
 const s=structuredClone(song);s.scene||={};s.scene.mmd=structuredClone(source.scene.mmd);s.scene.mmdInheritedFrom={songId:source.id,title:source.title,packId:source.scene.mmd.id};return s;
}
root.PulseMMDAudit={auditModel,selectedReport,attachDefault};if(typeof module!=='undefined')module.exports=root.PulseMMDAudit;
})(globalThis);
