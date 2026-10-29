/* Native DYMO Connect template supplied by the owner. Preserve media metadata. */
(function(global){
'use strict';
const SOURCE="<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<DesktopLabel Version=\"1\">\n  <DYMOLabel Version=\"3\">\n    <Description>DYMO Label</Description>\n    <Orientation>Portrait</Orientation>\n    <LabelName>1933084 Drbl 2-1/4 x 1-1/4 in</LabelName>\n    <InitialLength>0</InitialLength>\n    <BorderStyle>SolidLine</BorderStyle>\n    <DYMORect>\n      <DYMOPoint>\n        <X>0.03999997</X>\n        <Y>0.06</Y>\n      </DYMOPoint>\n      <Size>\n        <Width>2.17</Width>\n        <Height>1.13</Height>\n      </Size>\n    </DYMORect>\n    <BorderColor>\n      <SolidColorBrush>\n        <Color A=\"1\" R=\"0\" G=\"0\" B=\"0\"></Color>\n      </SolidColorBrush>\n    </BorderColor>\n    <BorderThickness>1</BorderThickness>\n    <Show_Border>False</Show_Border>\n    <DynamicLayoutManager>\n      <RotationBehavior>ClearObjects</RotationBehavior>\n      <LabelObjects>\n        <TextObject>\n          <Name>TextObject0</Name>\n          <Brushes>\n            <BackgroundBrush>\n              <SolidColorBrush>\n                <Color A=\"0\" R=\"0\" G=\"0\" B=\"0\"></Color>\n              </SolidColorBrush>\n            </BackgroundBrush>\n            <BorderBrush>\n              <SolidColorBrush>\n                <Color A=\"1\" R=\"0\" G=\"0\" B=\"0\"></Color>\n              </SolidColorBrush>\n            </BorderBrush>\n            <StrokeBrush>\n              <SolidColorBrush>\n                <Color A=\"1\" R=\"0\" G=\"0\" B=\"0\"></Color>\n              </SolidColorBrush>\n            </StrokeBrush>\n            <FillBrush>\n              <SolidColorBrush>\n                <Color A=\"0\" R=\"0\" G=\"0\" B=\"0\"></Color>\n              </SolidColorBrush>\n            </FillBrush>\n          </Brushes>\n          <Rotation>Rotation0</Rotation>\n          <OutlineThickness>1</OutlineThickness>\n          <IsOutlined>False</IsOutlined>\n          <BorderStyle>SolidLine</BorderStyle>\n          <Margin>\n            <DYMOThickness Left=\"0\" Top=\"0\" Right=\"0\" Bottom=\"0\" />\n          </Margin>\n          <HorizontalAlignment>Center</HorizontalAlignment>\n          <VerticalAlignment>Middle</VerticalAlignment>\n          <FitMode>AlwaysFit</FitMode>\n          <IsVertical>False</IsVertical>\n          <FormattedText>\n            <FitMode>AlwaysFit</FitMode>\n            <HorizontalAlignment>Center</HorizontalAlignment>\n            <VerticalAlignment>Middle</VerticalAlignment>\n            <IsVertical>False</IsVertical>\n            <LineTextSpan>\n              <TextSpan>\n                <Text>test</Text>\n                <FontInfo>\n                  <FontName>Segoe UI</FontName>\n                  <FontSize>60.9</FontSize>\n                  <IsBold>False</IsBold>\n                  <IsItalic>False</IsItalic>\n                  <IsUnderline>False</IsUnderline>\n                  <FontBrush>\n                    <SolidColorBrush>\n                      <Color A=\"1\" R=\"0\" G=\"0\" B=\"0\"></Color>\n                    </SolidColorBrush>\n                  </FontBrush>\n                </FontInfo>\n              </TextSpan>\n            </LineTextSpan>\n          </FormattedText>\n          <ObjectLayout>\n            <DYMOPoint>\n              <X>0.03999997</X>\n              <Y>0.06000001</Y>\n            </DYMOPoint>\n            <Size>\n              <Width>2.17</Width>\n              <Height>1.13</Height>\n            </Size>\n          </ObjectLayout>\n        </TextObject>\n      </LabelObjects>\n    </DynamicLayoutManager>\n  </DYMOLabel>\n  <LabelApplication>Blank</LabelApplication>\n  <DataTable>\n    <Columns></Columns>\n    <Rows></Rows>\n  </DataTable>\n</DesktopLabel>";
function supports(st){
  const sizes=[Number(st.w)||57,Number(st.h)||32].sort((a,b)=>a-b);
  return Math.abs(sizes[0]-32)<0.6&&Math.abs(sizes[1]-57)<0.6;
}
function parse(xml){
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('Modello DYMO nativo non valido.');
  return doc;
}
function text(node,selector,value){const el=node.querySelector(selector);if(!el)throw new Error('Elemento mancante nel modello DYMO: '+selector);el.textContent=String(value);}
function clean(value){return String(value??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');}
function build(data,st,qrXml=''){
  if(!supports(st))throw new Error('Il modello DYMO fornito richiede etichette 57 × 32 mm.');
  const doc=parse(SOURCE),object=doc.querySelector('TextObject'),formatted=object.querySelector('FormattedText');
  const line=formatted.querySelector('LineTextSpan').cloneNode(true);
  formatted.querySelectorAll('LineTextSpan').forEach(n=>n.remove());
  const groups=[[data.title||'BEPARYTECH',13,true],[data.meta||'',10,false],[data.note||'',11,false]];
  for(const [value,size,bold] of groups){
    if(!String(value).trim())continue;
    for(const valueLine of clean(value).split(/\r?\n/)){
      const next=line.cloneNode(true);text(next,'Text',valueLine||' ');text(next,'FontSize',size);text(next,'IsBold',bold?'True':'False');formatted.appendChild(next);
    }
  }
  // Keep the native full-label text box and the printer's media rectangle.
  // Scale/offset only adjust content, never the media identity or orientation.
  const rect=doc.querySelector('DYMOLabel > DYMORect');
  const base={x:Number(rect.querySelector('X').textContent),y:Number(rect.querySelector('Y').textContent),w:Number(rect.querySelector('Width').textContent),h:Number(rect.querySelector('Height').textContent)};
  const scale=Math.max(.7,Math.min(1.2,(Number(st.scale)||100)/100));
  const inset=Math.max(0,(Number(st.margin)||0)-1.5)/25.4;
  const x=Math.min(base.x+base.w-.3,Math.max(base.x,base.x+inset+(Number(st.offsetX)||0)/25.4));
  const y=Math.min(base.y+base.h-.3,Math.max(base.y,base.y+inset+(Number(st.offsetY)||0)/25.4));
  const w=Math.max(.2,Math.min((base.w-inset*2)*scale,base.x+base.w-x));
  const h=Math.max(.2,Math.min((base.h-inset*2)*scale,base.y+base.h-y));
  const layout=object.querySelector('ObjectLayout');
  text(layout,'X',x);text(layout,'Y',y);text(layout,'Width',w);text(layout,'Height',h);
  if(String(data.qrText||'').trim()){
    const qrDoc=parse(qrXml),source=qrDoc.querySelector('BarcodeObject');
    if(!source)throw new Error('Oggetto QR mancante: stampa interrotta per non omettere il codice.');
    const qr=doc.importNode(source,true),size=Math.min(.68,h),gap=.06;
    text(layout,'Width',Math.max(.2,w-size-gap));
    const qLayout=qr.querySelector('ObjectLayout');
    text(qLayout,'X',x+w-size);text(qLayout,'Y',y+(h-size)/2);text(qLayout,'Width',size);text(qLayout,'Height',size);
    doc.querySelector('LabelObjects').appendChild(qr);
  }
  return new XMLSerializer().serializeToString(doc);
}
global.BeparyNativeDymo={supports,build,source:()=>SOURCE};
})(window);
