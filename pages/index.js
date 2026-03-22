import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth, usePlatforms, useVotes, useReviews, useAllReviewPreviews } from '../lib/hooks'

// ─── BRAND LOGOS ──────────────────────────────────────────────────────────────
const LOGO_SOURCES = {
  "TikTok":         ["/logos/TikTok.png",         "https://logo.clearbit.com/tiktok.com",         "https://icons.duckduckgo.com/ip3/tiktok.com.ico"],
  "Instagram":      ["/logos/Instagram.png",      "https://logo.clearbit.com/instagram.com",      "https://icons.duckduckgo.com/ip3/instagram.com.ico"],
  "Signal":         ["/logos/Signal.png",         "https://logo.clearbit.com/signal.org",         "https://icons.duckduckgo.com/ip3/signal.org.ico"],
  "Spotify":        ["/logos/Spotify.png",        "https://logo.clearbit.com/spotify.com",        "https://icons.duckduckgo.com/ip3/spotify.com.ico"],
  "X (Twitter)":    ["/logos/X-Twitter.png",      "https://logo.clearbit.com/x.com",              "https://icons.duckduckgo.com/ip3/x.com.ico"],
  "WhatsApp":       ["/logos/WhatsApp.png",       "https://logo.clearbit.com/whatsapp.com",       "https://icons.duckduckgo.com/ip3/whatsapp.com.ico"],
  "McDonald's":     ["/logos/McDonalds.png",      "https://logo.clearbit.com/mcdonalds.com",      "https://icons.duckduckgo.com/ip3/mcdonalds.com.ico"],
  "Chipotle":       ["/logos/Chipotle.png",       "https://logo.clearbit.com/chipotle.com",       "https://icons.duckduckgo.com/ip3/chipotle.com.ico"],
  "Starbucks":      ["/logos/Starbucks.png",      "https://logo.clearbit.com/starbucks.com",      "https://icons.duckduckgo.com/ip3/starbucks.com.ico"],
  "Marriott":       ["/logos/Marriott.png",       "https://logo.clearbit.com/marriott.com",       "https://icons.duckduckgo.com/ip3/marriott.com.ico"],
  "Airbnb":         ["/logos/Airbnb.png",         "https://logo.clearbit.com/airbnb.com",         "https://icons.duckduckgo.com/ip3/airbnb.com.ico"],
  "Spirit Airlines":["/logos/Spirit-Airlines.png","https://logo.clearbit.com/spirit.com",         "https://icons.duckduckgo.com/ip3/spirit.com.ico"],
  "Emirates":       ["/logos/Emirates.png",       "https://logo.clearbit.com/emirates.com",       "https://icons.duckduckgo.com/ip3/emirates.com.ico"],
  "Southwest":      ["/logos/Southwest.png",      "https://logo.clearbit.com/southwest.com",      "https://icons.duckduckgo.com/ip3/southwest.com.ico"],
  "Netflix":        ["/logos/Netflix.png",        "https://logo.clearbit.com/netflix.com",        "https://icons.duckduckgo.com/ip3/netflix.com.ico"],
  "YouTube":        ["/logos/YouTube.png",        "https://logo.clearbit.com/youtube.com",        "https://icons.duckduckgo.com/ip3/youtube.com.ico"],
  "Chase":          ["/logos/Chase.png",          "https://logo.clearbit.com/chase.com",          "https://icons.duckduckgo.com/ip3/chase.com.ico"],
  "Chime":          ["/logos/Chime.png",          "https://logo.clearbit.com/chime.com",          "https://icons.duckduckgo.com/ip3/chime.com.ico"],
}
const BRAND_BG = {
  "TikTok":"#010101","Instagram":"#833ab4","Signal":"#3a76f0","Spotify":"#191414",
  "X (Twitter)":"#000","WhatsApp":"#075e54","McDonald's":"#da291c","Chipotle":"#441400",
  "Starbucks":"#00704a","Marriott":"#8b1a1a","Airbnb":"#ff5a5f","Spirit Airlines":"#ffdf00",
  "Emirates":"#d71921","Southwest":"#304cb2","Netflix":"#141414","YouTube":"#ff0000",
  "Chase":"#117aca","Chime":"#1ec677",
}

function BrandLogo({ name, size=46 }) {
  const sources = LOGO_SOURCES[name] || []
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  const bg = BRAND_BG[name] || '#1a1a2e'
  const r = Math.round(size * 0.22)
  if (failed || !sources.length) {
    const cols=["#6c63ff","#f77f00","#219ebc","#e63946","#2dc653","#ff006e","#fb8500","#023e8a"]
    const c=cols[(name.charCodeAt(0)||0)%cols.length]
    return <div style={{width:size,height:size,borderRadius:r,background:c,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid rgba(255,255,255,0.1)'}}>
      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:size*.5,color:'#fff',lineHeight:1}}>{name[0]}</span>
    </div>
  }
  return <div style={{width:size,height:size,borderRadius:r,background:bg,overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,0.1)'}}>
    <img src={sources[idx]} alt={name} onError={()=>idx+1<sources.length?setIdx(i=>i+1):setFailed(true)} style={{width:'72%',height:'72%',objectFit:'contain'}} crossOrigin="anonymous"/>
  </div>
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['All','Apps','Restaurants','Hotels','Airlines','Streaming','Banks']
const STATUS = {
  rising:   {color:'#00ff88',label:'📈 Rising',   bg:'rgba(0,255,136,0.08)', border:'rgba(0,255,136,0.2)' },
  declining:{color:'#ff8c42',label:'📉 Declining',bg:'rgba(255,140,66,0.08)',border:'rgba(255,140,66,0.2)'},
  stable:   {color:'#f0b429',label:'➡️ Stable',   bg:'rgba(240,180,41,0.07)',border:'rgba(240,180,41,0.15)'},
  boycott:  {color:'#ff2244',label:'🚨 BOYCOTT',  bg:'rgba(255,34,68,0.1)',  border:'rgba(255,34,68,0.4)' },
}
const fmt = n => n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'k':String(n)
const pct = (up,total) => total===0?0:Math.round((up/total)*100)
const avgRating = (reviews) => !reviews?.length?0:(reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length).toFixed(1)
const timeAgo = (ts) => {
  const s = Math.floor((Date.now()-new Date(ts))/1000)
  if(s<60) return 'just now'
  if(s<3600) return `${Math.floor(s/60)}m ago`
  if(s<86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function useNotifications() {
  const [notifs,setNotifs]=useState([])
  const push=useCallback((msg,type='info')=>{
    const id=Math.random().toString(36).slice(2)
    setNotifs(n=>[{id,msg,type},...n.slice(0,7)])
    setTimeout(()=>setNotifs(n=>n.filter(x=>x.id!==id)),5000)
  },[])
  return {notifs,push}
}
function NotifToast({notifs}) {
  const cols={info:'#00ccff',success:'#00ff88',warning:'#f0b429',alert:'#ff2244'}
  return (
    <div style={{position:'fixed',bottom:24,right:20,zIndex:2000,display:'flex',flexDirection:'column-reverse',gap:8,maxWidth:310,pointerEvents:'none'}}>
      {notifs.map(n=>(
        <div key={n.id} style={{background:'rgba(8,8,20,0.97)',border:`1px solid ${cols[n.type]}35`,borderLeft:`3px solid ${cols[n.type]}`,borderRadius:10,padding:'10px 14px',fontFamily:"'Space Mono',monospace",fontSize:11,color:'rgba(255,255,255,0.85)',animation:'slideIn 0.3s ease'}}>
          {n.msg}
        </div>
      ))}
    </div>
  )
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Sparkline({trend,w=70,h=24}) {
  const pts=useRef(null)
  if(!pts.current){let v=50,a=[];for(let i=0;i<14;i++){v+=(Math.random()-.5)*7+trend*.3;v=Math.max(5,Math.min(95,v));a.push(v);}pts.current=a;}
  const p=pts.current,mx=Math.max(...p),mn=Math.min(...p),rng=mx-mn||1
  const norm=v=>h-((v-mn)/rng)*h
  const d=p.map((v,i)=>`${i===0?'M':'L'} ${(i/13)*w} ${norm(v)}`).join(' ')
  const c=trend>=0?'#00ff88':'#ff5566'
  const uid=`sg${trend>0?'p':'n'}${String(Math.abs(trend)).replace('.','x')}`
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity=".18"/><stop offset="100%" stopColor={c} stopOpacity="0"/></linearGradient></defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${uid})`}/>
      <path d={d} stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── TICKER ──────────────────────────────────────────────────────────────────
function Ticker({items}) {
  const [x,setX]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setX(v=>v-.5),16);return()=>clearInterval(t);},[])
  const rep=[...items,...items,...items]
  return (
    <div style={{overflow:'hidden',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'rgba(0,0,0,0.4)',padding:'8px 0'}}>
      <div style={{display:'flex',gap:40,transform:`translateX(${x%(items.length*185+1)}px)`,whiteSpace:'nowrap',alignItems:'center'}}>
        {rep.map((item,i)=>(
          <span key={i} style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:item.trend>=0?'#00ff88':'#ff5566',display:'inline-flex',alignItems:'center',gap:8}}>
            <BrandLogo name={item.name} size={18}/>
            {item.name} <span style={{opacity:.4}}>{item.trend>=0?'▲':'▼'}{Math.abs(item.trend)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── STARS ───────────────────────────────────────────────────────────────────
function Stars({rating,size=14,interactive=false,onRate}) {
  const [hover,setHover]=useState(0)
  return (
    <div style={{display:'flex',gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} onClick={()=>interactive&&onRate&&onRate(i)} onMouseEnter={()=>interactive&&setHover(i)} onMouseLeave={()=>interactive&&setHover(0)}
          style={{fontSize:size,cursor:interactive?'pointer':'default',color:(interactive?(hover||rating):rating)>=i?'#f0b429':'rgba(255,255,255,0.15)',transition:'color 0.15s',lineHeight:1}}>★</span>
      ))}
    </div>
  )
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({onClose,children,width=480}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:12,backdropFilter:'blur(10px)'}} onClick={onClose}>
      <div style={{background:'#08081a',border:'1px solid rgba(255,255,255,0.09)',borderRadius:20,padding:26,width:'100%',maxWidth:width,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({onClose,auth,push}) {
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({username:'',email:'',password:''})
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)

  const handle = async () => {
    setErr('')
    if(!form.email||!form.password){setErr('Fill in all fields.');return}
    setLoading(true)
    if(mode==='signup'){
      if(!form.username){setErr('Username required.');setLoading(false);return}
      const {error}=await auth.signUp(form.email,form.password,form.username)
      if(error){setErr(error.message);setLoading(false);return}
      push('Account created! Check your email to confirm. 📧','success')
    } else {
      const {error}=await auth.signIn(form.email,form.password)
      if(error){setErr('Invalid email or password.');setLoading(false);return}
      push('Welcome back! ⚡','success')
    }
    setLoading(false)
    onClose()
  }

  return (
    <Modal onClose={onClose} width={440}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:2,color:'#fff',marginBottom:18}}>{mode==='login'?'WELCOME BACK':'JOIN PEOPLERATE'}</div>
      <div style={{display:'flex',gap:6,marginBottom:18,background:'rgba(255,255,255,0.04)',borderRadius:9,padding:4}}>
        {['login','signup'].map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:'8px 0',borderRadius:7,border:'none',background:mode===m?'rgba(0,255,136,0.12)':'transparent',color:mode===m?'#00ff88':'rgba(255,255,255,0.35)',fontFamily:"'Space Mono',monospace",fontSize:11,cursor:'pointer'}}>
            {m==='login'?'LOG IN':'SIGN UP'}
          </button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:11}}>
        {mode==='signup'&&<input placeholder="Username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} style={IS}/>}
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={IS}/>
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={IS} onKeyDown={e=>e.key==='Enter'&&handle()}/>
        {err&&<div style={{fontSize:11,color:'#ff5566',fontFamily:"'Space Mono',monospace"}}>{err}</div>}
        <button onClick={handle} style={BG} disabled={loading}>{loading?'...':(mode==='login'?'LOG IN':'CREATE ACCOUNT')}</button>
        <button onClick={auth.signInWithGoogle} style={{...BG,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)'}}>
          🔵 CONTINUE WITH GOOGLE
        </button>
        <div style={{textAlign:'center',fontSize:9,color:'rgba(255,255,255,0.2)',fontFamily:"'Space Mono',monospace"}}>YOUR VOTE. YOUR VOICE. REAL IMPACT.</div>
      </div>
    </Modal>
  )
}

// ─── SUBMIT PLATFORM MODAL ────────────────────────────────────────────────────
function SubmitModal({onClose,onSubmit,push}) {
  const [form,setForm]=useState({name:'',category:'Apps',description:'',tags:''})
  const [loading,setLoading]=useState(false)
  const handle=async()=>{
    if(!form.name.trim()||!form.description.trim())return
    setLoading(true)
    const tags=form.tags.split(',').map(t=>t.trim()).filter(Boolean)
    const {error}=await onSubmit({name:form.name,category:form.category,description:form.description,tags,status:'stable',upvotes:0,downvotes:0,trend:0})
    if(error){push('Error submitting. Try again.','alert');setLoading(false);return}
    push(`"${form.name}" is now live! 🗳️`,'success')
    onClose()
  }
  return (
    <Modal onClose={onClose} width={520}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1.5,color:'#fff',marginBottom:20}}>SUBMIT A PLATFORM</div>
      <div style={{display:'flex',flexDirection:'column',gap:11}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={LS}>NAME *</label><input placeholder="e.g. Uber" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={IS}/></div>
          <div><label style={LS}>CATEGORY *</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...IS,cursor:'pointer'}}>{CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div><label style={LS}>DESCRIPTION *</label><input placeholder="What does this platform do?" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={IS}/></div>
        <div><label style={LS}>TAGS (comma separated)</label><input placeholder="Hidden Fees, Bad Support" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} style={IS}/></div>
        <button onClick={handle} style={BG} disabled={loading||!form.name.trim()||!form.description.trim()}>{loading?'SUBMITTING...':'SUBMIT TO THE PEOPLE'}</button>
      </div>
    </Modal>
  )
}

// ─── REVIEW ITEM ─────────────────────────────────────────────────────────────
function ReviewItem({review,user,profile,onReply,onLike,depth=0}) {
  const [showReply,setShowReply]=useState(false)
  const [replyText,setReplyText]=useState('')
  const [submitting,setSubmitting]=useState(false)

  const submit=async()=>{
    if(!replyText.trim()||!user)return
    setSubmitting(true)
    await onReply({parentId:review.id,platformId:review.platform_id,userId:user.id,username:profile?.username||'user',avatar:profile?.avatar||'🧑',text:replyText.trim()})
    setReplyText('');setShowReply(false);setSubmitting(false)
  }

  return (
    <div style={{marginLeft:depth>0?18:0,borderLeft:depth>0?'2px solid rgba(255,255,255,0.06)':undefined,paddingLeft:depth>0?14:0}}>
      <div style={{background:depth>0?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.035)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'13px 15px',marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{review.avatar||'🧑'}</div>
            <div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'#fff',fontWeight:700}}>{review.username}</div>
              {review.rating>0&&<div style={{marginTop:3}}><Stars rating={review.rating} size={11}/></div>}
            </div>
          </div>
          <span style={{fontSize:9,color:'rgba(255,255,255,0.25)',fontFamily:"'Space Mono',monospace"}}>{timeAgo(review.created_at)}</span>
        </div>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.78)',lineHeight:1.65,marginBottom:10}}>{review.text}</p>
        <div style={{display:'flex',gap:14}}>
          <button onClick={()=>user&&onLike(review.id,review.likes)} style={{background:'none',border:'none',cursor:user?'pointer':'default',color:'rgba(255,255,255,0.35)',fontFamily:"'Space Mono',monospace",fontSize:10,padding:0}}>
            👍 {fmt(review.likes||0)}
          </button>
          {user&&depth===0&&<button onClick={()=>setShowReply(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',color:showReply?'#00ccff':'rgba(255,255,255,0.35)',fontFamily:"'Space Mono',monospace",fontSize:10,padding:0}}>💬 Reply</button>}
        </div>
        {showReply&&(
          <div style={{marginTop:10,display:'flex',gap:8}}>
            <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder={`Reply to ${review.username}...`} style={{...IS,flex:1,height:54,resize:'none',fontSize:11}}/>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <button onClick={submit} disabled={submitting||!replyText.trim()} style={{...BG,padding:'7px 14px',fontSize:10,width:'auto'}}>{submitting?'...':'POST'}</button>
              <button onClick={()=>setShowReply(false)} style={{...AB,padding:'7px 14px',fontSize:10}}>✕</button>
            </div>
          </div>
        )}
      </div>
      {review.replies?.map(r=><ReviewItem key={r.id} review={r} user={user} profile={profile} onReply={onReply} onLike={onLike} depth={depth+1}/>)}
    </div>
  )
}

// ─── COMPANY PAGE ─────────────────────────────────────────────────────────────
function CompanyPage({item,user,profile,userVotes,onVote,onClose,push}) {
  const {reviews,loading:rLoading,addReview,addReply,likeReview}=useReviews(item.id)
  const [newRating,setNewRating]=useState(0)
  const [newText,  setNewText]  =useState('')
  const [sortBy,   setSortBy]   =useState('newest')
  const [submitting,setSubmitting]=useState(false)
  const s=STATUS[item.status]||STATUS.stable
  const approval=pct(item.upvotes,item.votes)
  const avg=avgRating(reviews)
  const voted=userVotes[item.id]
  const dist=[5,4,3,2,1].map(star=>({star,count:reviews.filter(r=>r.rating===star).length}))
  const sorted=[...reviews].sort((a,b)=>{
    if(sortBy==='top') return (b.likes||0)-(a.likes||0)
    if(sortBy==='highest') return b.rating-a.rating
    if(sortBy==='lowest') return a.rating-b.rating
    return new Date(b.created_at)-new Date(a.created_at)
  })

  const submitReview=async()=>{
    if(!newText.trim()||!user||newRating===0)return
    setSubmitting(true)
    const {error}=await addReview({platformId:item.id,userId:user.id,username:profile?.username||'user',avatar:profile?.avatar||'🧑',rating:newRating,text:newText.trim()})
    if(error) push('Error posting review.','alert')
    else { push('Review posted! ⭐','success');setNewText('');setNewRating(0) }
    setSubmitting(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'#05050e',zIndex:900,overflowY:'auto'}}>
      {/* Back header */}
      <div style={{position:'sticky',top:0,zIndex:10,background:'rgba(5,5,14,0.97)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'13px 20px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'7px 14px',color:'rgba(255,255,255,0.7)',fontFamily:"'Space Mono',monospace",fontSize:11,cursor:'pointer'}}>← BACK</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,color:'rgba(255,255,255,0.4)'}}>PEOPLE<span style={{color:'#00ff88'}}>RATE</span></div>
      </div>

      <div style={{maxWidth:860,margin:'0 auto',padding:'28px 16px',animation:'fadeUp 0.4s ease'}}>
        {/* Hero */}
        <div style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${s.border}`,borderRadius:20,padding:'24px',marginBottom:20,display:'flex',gap:18,flexWrap:'wrap',alignItems:'flex-start'}}>
          <BrandLogo name={item.name} size={68}/>
          <div style={{flex:1,minWidth:180}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5,flexWrap:'wrap'}}>
              <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:1,color:'#fff',lineHeight:1}}>{item.name}</h1>
              <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:7,padding:'3px 10px',fontSize:10,color:s.color,fontFamily:"'Space Mono',monospace"}}>{s.label}</div>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:"'Space Mono',monospace",marginBottom:10}}>{item.description} · {item.category}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
              {(item.tags||[]).map((t,i)=><span key={i} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:20,padding:'2px 9px',fontSize:9,color:'rgba(255,255,255,0.45)',fontFamily:"'Space Mono',monospace"}}>{t}</span>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(80px,1fr))',gap:8}}>
              {[['APPROVAL',`${approval}%`,approval>=60?'#00ff88':'#ff5566'],['VOTES',fmt((item.upvotes||0)+(item.downvotes||0)),'#fff'],['TREND',`${item.trend>=0?'+':''}${item.trend}%`,item.trend>=0?'#00ff88':'#ff5566'],['REVIEWS',reviews.length,'#00ccff'],['AVG ★',avg>0?avg:'—','#f0b429']].map(([l,v,c])=>(
                <div key={l} style={{background:'rgba(0,0,0,0.3)',borderRadius:9,padding:'9px 11px'}}>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:2}}>{l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:19,color:c}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
          {/* Vote */}
          <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:18}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1,color:'rgba(255,255,255,0.5)',marginBottom:12}}>CAST YOUR VOTE</div>
            <div style={{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
              <div style={{height:'100%',width:`${approval}%`,background:'linear-gradient(90deg,#00ff88,#00ccff)',borderRadius:3,transition:'width 0.6s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:'#00ff88'}}>👍 {fmt(item.upvotes||0)}</span>
              <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:'rgba(255,255,255,0.5)',fontWeight:700}}>{approval}%</span>
              <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:'#ff5566'}}>👎 {fmt(item.downvotes||0)}</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>onVote(item.id,'up',item.upvotes,item.downvotes)} style={{flex:1,padding:'9px 0',borderRadius:9,border:`1px solid ${voted==='up'?'#00ff88':'rgba(0,255,136,0.15)'}`,background:voted==='up'?'rgba(0,255,136,0.15)':'rgba(0,255,136,0.04)',color:'#00ff88',fontFamily:"'Space Mono',monospace",fontSize:11,cursor:voted?'default':'pointer'}}>👍 SUPPORT</button>
              <button onClick={()=>onVote(item.id,'down',item.upvotes,item.downvotes)} style={{flex:1,padding:'9px 0',borderRadius:9,border:`1px solid ${voted==='down'?'#ff4466':'rgba(255,68,102,0.15)'}`,background:voted==='down'?'rgba(255,68,102,0.15)':'rgba(255,68,102,0.04)',color:'#ff4466',fontFamily:"'Space Mono',monospace",fontSize:11,cursor:voted?'default':'pointer'}}>👎 AGAINST</button>
            </div>
          </div>

          {/* Rating distribution */}
          <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:18}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1,color:'rgba(255,255,255,0.5)',marginBottom:12}}>RATING BREAKDOWN</div>
            {avg>0?(
              <div style={{display:'flex',gap:14,alignItems:'center'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:'#f0b429',lineHeight:1}}>{avg}</div>
                  <Stars rating={parseFloat(avg)} size={13}/>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace",marginTop:3}}>{reviews.length} reviews</div>
                </div>
                <div style={{flex:1}}>
                  {dist.map(({star,count})=>(
                    <div key={star} style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.4)',width:8}}>{star}</span>
                      <span style={{fontSize:9,color:'#f0b429'}}>★</span>
                      <div style={{flex:1,height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${reviews.length?Math.round((count/reviews.length)*100):0}%`,background:star>=4?'#00ff88':star===3?'#f0b429':'#ff5566',borderRadius:2}}/>
                      </div>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.3)',width:16,textAlign:'right'}}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <div style={{textAlign:'center',padding:'20px 0',color:'rgba(255,255,255,0.25)',fontFamily:"'Space Mono',monospace",fontSize:11}}>No ratings yet</div>
            )}
          </div>
        </div>

        {/* Write review */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20,marginBottom:20}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,color:'#fff',marginBottom:14}}>WRITE A REVIEW</div>
          {user?(
            <div>
              <div style={{marginBottom:12}}>
                <label style={LS}>YOUR RATING *</label>
                <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4}}>
                  <Stars rating={newRating} size={26} interactive onRate={setNewRating}/>
                  {newRating>0&&<span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'#f0b429'}}>{['','Terrible','Poor','Average','Good','Excellent'][newRating]}</span>}
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={LS}>YOUR REVIEW *</label>
                <textarea value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Share your honest experience. Be specific — your review helps others." style={{...IS,height:88,resize:'vertical',marginTop:4}}/>
              </div>
              <button onClick={submitReview} style={BG} disabled={submitting||!newText.trim()||newRating===0}>{submitting?'POSTING...':'POST REVIEW'}</button>
            </div>
          ):(
            <div style={{padding:'16px',background:'rgba(0,255,136,0.04)',border:'1px solid rgba(0,255,136,0.1)',borderRadius:10,textAlign:'center',fontSize:11,color:'rgba(255,255,255,0.5)',fontFamily:"'Space Mono',monospace"}}>
              LOG IN TO WRITE A REVIEW
            </div>
          )}
        </div>

        {/* Reviews list */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:'#fff'}}>{reviews.length} REVIEWS</div>
            <div style={{display:'flex',gap:3,background:'rgba(255,255,255,0.03)',borderRadius:8,padding:3}}>
              {[['newest','🕐 Newest'],['top','🔥 Top'],['highest','⬆️ Highest'],['lowest','⬇️ Lowest']].map(([key,label])=>(
                <button key={key} onClick={()=>setSortBy(key)} style={{padding:'5px 10px',borderRadius:6,border:'none',background:sortBy===key?'rgba(0,255,136,0.1)':'transparent',color:sortBy===key?'#00ff88':'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace",fontSize:9,cursor:'pointer'}}>{label}</button>
              ))}
            </div>
          </div>
          {rLoading?(
            <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace",fontSize:11}}>Loading reviews...</div>
          ):sorted.length===0?(
            <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.2)',fontFamily:"'Space Mono',monospace",fontSize:12}}>No reviews yet. Be the first! 👆</div>
          ):(
            sorted.map(r=><ReviewItem key={r.id} review={r} user={user} profile={profile} onReply={addReply} onLike={(id,likes)=>likeReview(id,user?.id,likes)}/>)
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function Card({item,onVote,onOpenPage,userVotes,previews}) {
  const s=STATUS[item.status]||STATUS.stable
  const approval=pct(item.upvotes||0,item.votes||0)
  const voted=userVotes[item.id]
  const preview=previews||[]
  const avg=avgRating(preview)

  return (
    <div style={{background:'rgba(9,9,20,0.97)',border:`1px solid ${item.status==='boycott'?'rgba(255,34,68,0.3)':item.status==='rising'?'rgba(0,255,136,0.12)':'rgba(255,255,255,0.065)'}`,borderRadius:16,overflow:'hidden',display:'flex',flexDirection:'column',transition:'transform 0.2s,box-shadow 0.2s',cursor:'pointer'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 28px ${s.color}14`}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
      {item.status==='boycott'&&<div style={{height:2,background:'linear-gradient(90deg,#ff2244,transparent)'}}/>}

      <div style={{padding:18,flex:1}} onClick={()=>onOpenPage(item)}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:12}}>
          <BrandLogo name={item.name} size={44}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace"}}>{item.description}</div>
          </div>
          <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:7,padding:'3px 8px',fontSize:9,color:s.color,fontFamily:"'Space Mono',monospace",whiteSpace:'nowrap'}}>{s.label}</div>
        </div>
        {/* Sparkline + trend */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <Sparkline trend={item.trend||0}/>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:(item.trend||0)>=0?'#00ff88':'#ff5566',lineHeight:1}}>{(item.trend||0)>=0?'+':''}{item.trend||0}%</div>
          </div>
        </div>
        {/* Approval bar */}
        <div style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:'#00ff88'}}>👍 {fmt(item.upvotes||0)}</span>
            <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:'rgba(255,255,255,0.5)',fontWeight:700}}>{approval}%</span>
            <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:'#ff5566'}}>👎 {fmt(item.downvotes||0)}</span>
          </div>
          <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${approval}%`,background:'linear-gradient(90deg,#00ff88,#00ccff)',borderRadius:2,transition:'width 0.6s'}}/>
          </div>
        </div>
        {/* Stars */}
        {avg>0&&<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}><Stars rating={parseFloat(avg)} size={12}/><span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#f0b429'}}>{avg}</span><span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.3)'}}>({preview.length})</span></div>}
        {/* Tags */}
        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:preview.length?10:0}}>
          {(item.tags||[]).map((t,i)=><span key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:'2px 7px',fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:"'Space Mono',monospace"}}>{t}</span>)}
        </div>
        {/* Preview reviews */}
        {preview.length>0&&(
          <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:10}}>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.25)',fontFamily:"'Space Mono',monospace",marginBottom:6,letterSpacing:1}}>LATEST REVIEWS</div>
            {preview.map(r=>(
              <div key={r.id} style={{marginBottom:6,padding:'7px 9px',background:'rgba(255,255,255,0.025)',borderRadius:8}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:13}}>{r.avatar||'🧑'}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#fff'}}>{r.username}</span>
                  <Stars rating={r.rating} size={9}/>
                </div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{r.text}</div>
              </div>
            ))}
            <div style={{fontSize:9,color:'rgba(0,255,136,0.5)',fontFamily:"'Space Mono',monospace",textAlign:'center',marginTop:4}}>TAP TO SEE ALL REVIEWS →</div>
          </div>
        )}
      </div>

      {/* Vote buttons */}
      <div style={{padding:'0 16px 12px',display:'flex',gap:7}}>
        <button onClick={e=>{e.stopPropagation();onVote(item.id,'up',item.upvotes,item.downvotes)}} style={{flex:1,padding:'8px 0',borderRadius:9,border:`1px solid ${voted==='up'?'#00ff88':'rgba(0,255,136,0.14)'}`,background:voted==='up'?'rgba(0,255,136,0.13)':'rgba(0,255,136,0.04)',color:'#00ff88',fontFamily:"'Space Mono',monospace",fontSize:11,cursor:voted?'default':'pointer'}}>👍 SUPPORT</button>
        <button onClick={e=>{e.stopPropagation();onVote(item.id,'down',item.upvotes,item.downvotes)}} style={{flex:1,padding:'8px 0',borderRadius:9,border:`1px solid ${voted==='down'?'#ff4466':'rgba(255,68,102,0.14)'}`,background:voted==='down'?'rgba(255,68,102,0.13)':'rgba(255,68,102,0.04)',color:'#ff4466',fontFamily:"'Space Mono',monospace",fontSize:11,cursor:voted?'default':'pointer'}}>👎 AGAINST</button>
      </div>
      <div style={{padding:'0 16px 14px'}}>
        <button onClick={()=>onOpenPage(item)} style={{...AB,width:'100%',padding:'8px 0',fontSize:10,textAlign:'center'}}>💬 READ ALL REVIEWS & RATE</button>
      </div>
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const IS={width:'100%',padding:'10px 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:12,outline:'none'}
const LS={display:'block',marginBottom:4,fontSize:9,color:'rgba(255,255,255,0.38)',fontFamily:"'Space Mono',monospace",letterSpacing:1}
const BG={padding:'11px 0',width:'100%',borderRadius:10,border:'1px solid rgba(0,255,136,0.28)',background:'rgba(0,255,136,0.1)',color:'#00ff88',fontFamily:"'Space Mono',monospace",fontSize:12,cursor:'pointer',fontWeight:700}
const AB={flex:1,padding:'7px 0',borderRadius:8,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.025)',color:'rgba(255,255,255,0.42)',fontFamily:"'Space Mono',monospace",fontSize:10,cursor:'pointer'}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const auth = useAuth()
  const { platforms, loading: pLoading, addPlatform } = usePlatforms()
  const { userVotes, castVote } = useVotes(auth.user?.id)
  const [category,  setCategory]  = useState('All')
  const [sort,      setSort]      = useState('trending')
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState('all')
  const [showAuth,  setShowAuth]  = useState(false)
  const [showSubmit,setShowSubmit]= useState(false)
  const [activePage,setActivePage]= useState(null)
  const { notifs, push } = useNotifications()

  const platformIds = platforms.map(p=>p.id)
  const { previews } = useAllReviewPreviews(platformIds)

  const handleVote = async (platformId, voteType, upvotes, downvotes) => {
    if(!auth.user){setShowAuth(true);push('Log in to vote! 🗳️','warning');return}
    const {error}=await castVote(platformId,voteType,upvotes,downvotes)
    if(error) return
    const item=platforms.find(p=>p.id===platformId)
    push(`Vote cast for ${item?.name}! ${voteType==='up'?'👍':'👎'}`,'success')
  }

  let filtered=platforms.filter(item=>{
    if(category!=='All'&&item.category!==category)return false
    if(search&&!item.name.toLowerCase().includes(search.toLowerCase()))return false
    if(tab==='rising')      return item.status==='rising'
    if(tab==='boycott')     return item.status==='boycott'||item.status==='declining'
    if(tab==='recommended') return item.status==='rising'&&pct(item.upvotes,item.votes)>75
    return true
  })
  if(sort==='trending')   filtered=[...filtered].sort((a,b)=>Math.abs(b.trend)-Math.abs(a.trend))
  if(sort==='most_votes') filtered=[...filtered].sort((a,b)=>((b.upvotes||0)+(b.downvotes||0))-((a.upvotes||0)+(a.downvotes||0)))
  if(sort==='highest')    filtered=[...filtered].sort((a,b)=>pct(b.upvotes,b.votes)-pct(a.upvotes,a.votes))
  if(sort==='lowest')     filtered=[...filtered].sort((a,b)=>pct(a.upvotes,a.votes)-pct(b.upvotes,b.votes))

  const totalVotes=platforms.reduce((s,i)=>s+(i.upvotes||0)+(i.downvotes||0),0)
  const boycottCount=platforms.filter(i=>i.status==='boycott').length
  // Sync activePage with latest platform data
  const activeItem=activePage?platforms.find(p=>p.id===activePage.id)||activePage:null

  return (
    <>
      <Head>
        <title>PeopleRate — The People Are In Control</title>
        <meta name="description" content="Real-time people-powered ratings. Vote, review, hold companies accountable."/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{minHeight:'100vh',background:'#05050e',color:'#fff'}}>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          input,select,textarea{color:#fff!important;caret-color:#00ff88}
          input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.28)!important}
          button:disabled{opacity:.4;cursor:not-allowed!important}
        `}</style>

        <div style={{position:'fixed',top:-250,left:-250,width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,255,136,0.03) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'fixed',bottom:-250,right:-250,width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,68,102,0.03) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}}/>

        <div style={{position:'relative',zIndex:1}}>
          {/* HEADER */}
          <header style={{padding:'13px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,background:'rgba(5,5,14,0.97)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:100,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setActivePage(null)}>
              <div style={{width:33,height:33,borderRadius:9,background:'linear-gradient(135deg,#00ff88,#00ccff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>⚖️</div>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:23,letterSpacing:2,lineHeight:1}}>PEOPLE<span style={{color:'#00ff88'}}>RATE</span></div>
                <div style={{fontSize:8,color:'rgba(255,255,255,0.28)',fontFamily:"'Space Mono',monospace",letterSpacing:1}}>THE PEOPLE ARE IN CONTROL</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#00ff88',animation:'blink 1.5s infinite'}}/>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#00ff88'}}>LIVE</span>
              </div>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.22)'}}>{fmt(totalVotes)} VOTES</span>
              {boycottCount>0&&<span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'rgba(255,34,68,0.8)',padding:'5px 9px',border:'1px solid rgba(255,34,68,0.25)',borderRadius:7,background:'rgba(255,34,68,0.07)'}}>🚨 {boycottCount}</span>}
              {auth.user?(
                <div style={{display:'flex',alignItems:'center',gap:7,padding:'6px 11px',background:'rgba(0,255,136,0.07)',border:'1px solid rgba(0,255,136,0.18)',borderRadius:8}}>
                  <span style={{fontSize:15}}>{auth.profile?.avatar||'🧑'}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#00ff88'}}>{auth.profile?.username||'user'}</span>
                  <button onClick={auth.signOut} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:13,padding:0,marginLeft:2}}>✕</button>
                </div>
              ):(
                <button onClick={()=>setShowAuth(true)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(0,255,136,0.28)',background:'rgba(0,255,136,0.07)',color:'#00ff88',fontFamily:"'Space Mono',monospace",fontSize:10,cursor:'pointer'}}>LOG IN</button>
              )}
            </div>
          </header>

          {!pLoading&&platforms.length>0&&<Ticker items={platforms}/>}

          <div style={{maxWidth:1280,margin:'0 auto',padding:'22px 16px'}}>
            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(105px,1fr))',gap:9,marginBottom:20,animation:'fadeIn 0.5s ease'}}>
              {[['TOTAL VOTES',fmt(totalVotes),'#fff'],['PLATFORMS',platforms.length,'#00ccff'],['RISING',platforms.filter(i=>i.status==='rising').length,'#00ff88'],['DECLINING',platforms.filter(i=>i.status==='declining').length,'#ff8c42'],['BOYCOTT',boycottCount,'#ff2244']].map(([l,v,c])=>(
                <div key={l} style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:11,padding:'11px 13px'}}>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace",marginBottom:3,letterSpacing:1}}>{l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:23,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{display:'flex',gap:9,marginBottom:13,flexWrap:'wrap'}}>
              <div style={{position:'relative',flex:'1 1 170px'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search platforms..." style={{...IS,paddingLeft:32}}/>
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',opacity:.35,fontSize:13}}>🔍</span>
              </div>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{...IS,width:'auto',cursor:'pointer'}}>
                <option value="trending">🔥 Trending</option>
                <option value="most_votes">📊 Most Votes</option>
                <option value="highest">✅ Highest</option>
                <option value="lowest">⚠️ Lowest</option>
              </select>
              <button onClick={()=>{if(!auth.user){setShowAuth(true);push('Log in to submit! 🔐','warning');return}setShowSubmit(true)}} style={{padding:'10px 16px',borderRadius:9,border:'1px solid rgba(0,204,255,0.28)',background:'rgba(0,204,255,0.07)',color:'#00ccff',fontFamily:"'Space Mono',monospace",fontSize:10,cursor:'pointer',whiteSpace:'nowrap'}}>➕ SUBMIT</button>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:3,marginBottom:13,background:'rgba(255,255,255,0.025)',borderRadius:9,padding:3,width:'fit-content',flexWrap:'wrap'}}>
              {[['all','🌐 All'],['rising','📈 Rising'],['boycott','🚨 Under Fire'],['recommended','✅ Recommended']].map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{padding:'6px 12px',borderRadius:7,border:'none',background:tab===key?'rgba(0,255,136,0.1)':'transparent',color:tab===key?'#00ff88':'rgba(255,255,255,0.32)',fontFamily:"'Space Mono',monospace",fontSize:9,cursor:'pointer'}}>{label}</button>
              ))}
            </div>

            {/* Category pills */}
            <div style={{display:'flex',gap:6,marginBottom:18,flexWrap:'wrap'}}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setCategory(cat)} style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${category===cat?'rgba(0,255,136,0.4)':'rgba(255,255,255,0.08)'}`,background:category===cat?'rgba(0,255,136,0.08)':'rgba(255,255,255,0.02)',color:category===cat?'#00ff88':'rgba(255,255,255,0.38)',fontFamily:"'Space Mono',monospace",fontSize:9,cursor:'pointer'}}>{cat}</button>
              ))}
            </div>

            {pLoading?(
              <div style={{textAlign:'center',padding:60,color:'rgba(255,255,255,0.3)',fontFamily:"'Space Mono',monospace",fontSize:12}}>
                <div style={{width:24,height:24,border:'2px solid rgba(0,255,136,0.3)',borderTop:'2px solid #00ff88',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
                Loading platforms...
              </div>
            ):(
              <>
                <div style={{marginBottom:13,fontFamily:"'Space Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.22)'}}>
                  {filtered.length} PLATFORMS · REAL-TIME SHARED DATABASE · CLICK TO REVIEW
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:13,animation:'fadeIn 0.4s ease'}}>
                  {filtered.map(item=>(
                    <Card key={item.id} item={item} onVote={handleVote} onOpenPage={setActivePage} userVotes={userVotes} previews={previews[item.id]}/>
                  ))}
                </div>
                {filtered.length===0&&<div style={{textAlign:'center',padding:52,color:'rgba(255,255,255,0.18)',fontFamily:"'Space Mono',monospace",fontSize:11}}>No results found.</div>}
              </>
            )}

            <div style={{marginTop:46,paddingTop:18,borderTop:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:'rgba(255,255,255,0.1)'}}>PEOPLE<span style={{color:'rgba(0,255,136,0.2)'}}>RATE</span></div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.12)',marginTop:4,letterSpacing:1}}>THE VOICE OF THE PEOPLE · LIVE · UNFILTERED · UNSTOPPABLE</div>
            </div>
          </div>
        </div>

        {/* Company page */}
        {activeItem&&(
          <CompanyPage item={activeItem} user={auth.user} profile={auth.profile} userVotes={userVotes} onVote={handleVote} onClose={()=>setActivePage(null)} push={push}/>
        )}

        {showAuth  &&<AuthModal   onClose={()=>setShowAuth(false)}   auth={auth} push={push}/>}
        {showSubmit&&<SubmitModal onClose={()=>setShowSubmit(false)} onSubmit={addPlatform} push={push}/>}

        <NotifToast notifs={notifs}/>
      </div>
    </>
  )
}
