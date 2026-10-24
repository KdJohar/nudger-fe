// Capture real, unchanged local UIs with isolated sample sessions. Never calls a backend.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const out = process.env.SHOWCASE_OUTPUT || 'scripts/marketing-artifacts'
await mkdir(out, { recursive: true })
const auth = { access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 900, token_type: 'Bearer' }
const user = { id: 'fixture-user', name: 'Sample user', email: 'sample@example.test' }
const merchants = [
  { id: 'studio', display_name: 'Studio Notes', profile_type: 'creator', nudger_id: 'studio-notes' },
  { id: 'everyday', display_name: 'Everyday', profile_type: 'platform', nudger_id: 'everyday' },
  { id: 'weekend', display_name: 'The Weekend Edit', profile_type: 'creator', nudger_id: 'weekend-edit' },
  { id: 'field', display_name: 'Field Notes', profile_type: 'creator', nudger_id: 'field-notes' },
].map(item => ({ ...item, is_active: true, is_subscribed: true, profile_image_url: '', about: 'A little inspiration, when it matters.', website_url: null }))
const feed = [
  ['studio', 'Studio Notes', 'creator', 'We’re going live in 10 minutes. Come hang out.'],
  ['build', 'Build alerts', 'hook', 'Your build is ready to review. Everything passed.'],
  ['everyday', 'Everyday', 'platform', 'Your weekly roundup is ready. Take a look when you have a moment.'],
  ['weekend', 'The Weekend Edit', 'creator', 'The new episode is here. A little inspiration for your weekend.'],
  ['home', 'Home routine', 'hook', 'Your 3D print has finished.'],
  ['field', 'Field Notes', 'creator', 'A new story from the trail. This one’s worth a pause.'],
  ['python', 'Python script', 'hook', 'Your data export finished successfully.'],
].map(([id,name,type,message],i) => ({ id: `sample-${i}`, sender_id:id,sender_name:name,sender_type:type,sender_avatar_url:null,message,title:name,received_at:new Date(Date.now()-i*780000).toISOString(),delivery_status:'success',notification_format:'basic' }))
const profile = { id: 'fixture-merchant', user_id: user.id, display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
async function contextFor(base, receiver) {
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname))
  const context = await browser.newContext({ viewport: receiver ? { width:390,height:780 } : { width:1440,height:900 }, deviceScaleFactor:1,colorScheme:'light', reducedMotion:'reduce',serviceWorkers:'block' })
  await context.addInitScript(({receiver}) => { localStorage.setItem(receiver ? 'nudgee.vuetify.refresh_token' : 'nudger.refresh_token','fixture-refresh'); localStorage.setItem('plug-nudge-theme','light') }, {receiver})
  await context.route('**/*', route => {
    const url=new URL(route.request().url())
    if (!['localhost','127.0.0.1'].includes(url.hostname)) return route.abort()
    return route.continue()
  })
  await context.route('**/runtime-config.js', route => route.fulfill({contentType:'application/javascript',body:receiver ? 'window.__NUDGE_RUNTIME_CONFIG__={apiBaseUrl:""}' : 'window.__NUDGER_CONFIG__={apiBaseUrl:"/",profileImageSourceMaxBytes:10485760,profileImageFinalMaxBytes:1000000,profileImageMaxDimension:1280,profileImageWebpQuality:0.86}'}))
  await context.route('**/v1/**', async route => {
    const path=new URL(route.request().url()).pathname
    const reply=data=>route.fulfill({contentType:'application/json',body:JSON.stringify({message:'Sample data',data,errors:{}})})
    if(path.endsWith('/refresh')) return reply({auth,user,...(!receiver?{merchant_profile:profile}:{})})
    assert.equal(route.request().method(),'GET','Screenshot capture must not mutate data')
    if(path.endsWith('/profile')) return reply(profile)
    if(receiver) {
      if(path==='/v1/app-nudgee/nudges') return reply({nudges:feed,total:feed.length,page_size:20,next:null,lookback_days:7})
      if(path==='/v1/app-nudger/merchant') return reply({items:merchants,total:merchants.length,page_size:20,next:null})
      if(path==='/v1/app-nudgee/subscriptions') return reply(Object.fromEntries(merchants.map(m=>[m.id,{...m,is_muted:false,subscribe_to_transaction:true,subscribe_to_broadcast:true,nudge_id:m.profile_type==='platform'?'123456':null}])))
      if(path==='/v1/app-nudgee/hook') return reply({hooks:[{id:'build',name:'Build alerts',webhook_secret:'demo-only-not-a-real-webhook',is_muted:false}]})
      console.log('Unmatched sample receiver request:', path)
      return reply({})
    }
    if(path.endsWith('/audience/overview')) {
      const snapshot={total_audience:1248,new_subscribers:186,unsubscribed_users:12,unsubscribe_rate:0.9,muted_subscribers:48,reachable_subscribers:1200,broadcast_reach:1200,transactional_reach:1200}
      const trend=Array.from({length:30},(_,i)=>({date:new Date(Date.now()-(29-i)*86400000).toISOString().slice(0,10),active_subscribers:870+i*13,new_subscribers:4+i%5,unsubscribed_users:i%3}))
      return reply({...snapshot,merchant_profile_id:profile.id,profile_type:'platform',active_subscribers:1248,period:'30d',breakdown:{...snapshot,broadcast_subscribed:1248,broadcast_unsubscribed:0,transactional_subscribed:1248,transactional_unsubscribed:0},comparison:{period:'30d',current:snapshot,previous:{...snapshot,new_subscribers:124}},trend,comparison_trend:trend.map(p=>({...p,previous_active_subscribers:p.active_subscribers-170})),generated_at:new Date().toISOString()})
    }
    if(path.endsWith('/nudges')) return reply({items:['We’re live in 10 minutes. Join us for a fresh conversation.','The new episode is ready. Find your next little inspiration.','Your weekly roundup is here.','A new story from the studio.'].map((message,i)=>({id:`sample-history-${i}`,title:'Studio Notes',message,sender:'platform',nudge_type:'broadcast',notification_format:'rich',destination_url:'https://example.com/watch',cta_label:'watch_now',media_url:null,status:'completed',created_at:new Date(Date.now()-i*86400000).toISOString(),completed_at:new Date(Date.now()-i*86400000+5000).toISOString(),engagement_as_of:new Date().toISOString(),stats:{total_audience:1200-i*30,total_devices:1250-i*30,push_delivered:1180-i*30,push_suppressed:20,failed_deliveries:0,total_clicks:180-i*20,ctr:Number(((180-i*20)/(1200-i*30)*100).toFixed(1))}})),next:null,page_size:20})
    return reply({items:[],next:null})
  })
  return context
}
try {
  const receiverBase=process.env.RECEIVER_BASE_URL||'http://localhost:5173'
  const receiver=await contextFor(receiverBase,true)
  const rp=await receiver.newPage()
  await rp.goto(`${receiverBase}/inbox`)
  await rp.getByText('Your build is ready to review. Everything passed.',{exact:true}).waitFor()
  await rp.screenshot({path:`${out}/app-inbox.png`})
  await rp.goto(`${receiverBase}/discover`)
  try { await rp.getByText('The Weekend Edit',{exact:true}).waitFor({timeout:8000}) } catch (error) { console.log(await rp.locator('body').innerText()); throw error }
  await rp.screenshot({path:`${out}/app-discover.png`})
  await receiver.close()
  const merchantBase=process.env.MERCHANT_BASE_URL||'http://localhost:5174'
  const merchant=await contextFor(merchantBase,false)
  const mp=await merchant.newPage()
  await mp.goto(`${merchantBase}/audience`)
  await mp.getByText('Currently active subscribers',{exact:true}).waitFor()
  await mp.locator('.ui-stat').first().waitFor()
  await mp.screenshot({path:`${out}/dashboard-audience.png`})
  await mp.goto(`${merchantBase}/nudges`)
  await mp.getByText('Your weekly roundup is here.',{exact:true}).waitFor()
  await mp.screenshot({path:`${out}/dashboard-history.png`})
  await merchant.close()
  console.log('Captured four actual local UI screens with isolated sample sessions. All API traffic intercepted; no live data or sends.')
} finally { await browser.close() }
