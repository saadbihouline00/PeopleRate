import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ─── AUTH HOOK ────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  const signUp = async (email, password, username) => {
    const avatars = ['🧑','👩','👨','🧕','👦','👧','🧔','👱','🧑‍💻','👩‍💻']
    const avatar  = avatars[Math.floor(Math.random() * avatars.length)]
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username, avatar } }
    })
    return { error }
  }

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, profile, loading, signUp, signIn, signInWithGoogle, signOut }
}

// ─── PLATFORMS HOOK ───────────────────────────────────────────────────────────
export function usePlatforms() {
  const [platforms, setPlatforms] = useState([])
  const [loading,   setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('id')
    if (!error) setPlatforms(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    // Real-time subscription
    const channel = supabase
      .channel('platforms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platforms' }, () => fetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addPlatform = async (platform) => {
    const { data, error } = await supabase.from('platforms').insert([platform]).select().single()
    return { data, error }
  }

  return { platforms, loading, refetch: fetch, addPlatform }
}

// ─── VOTES HOOK ───────────────────────────────────────────────────────────────
export function useVotes(userId) {
  const [userVotes, setUserVotes] = useState({}) // { platformId: 'up'|'down' }

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      const { data } = await supabase.from('votes').select('platform_id, vote_type').eq('user_id', userId)
      if (data) {
        const map = {}
        data.forEach(v => { map[v.platform_id] = v.vote_type })
        setUserVotes(map)
      }
    }
    fetch()
  }, [userId])

  const castVote = async (platformId, voteType, currentUpvotes, currentDownvotes) => {
    if (!userId) return { error: 'Not logged in' }
    if (userVotes[platformId]) return { error: 'Already voted' }

    // Optimistic update
    setUserVotes(v => ({ ...v, [platformId]: voteType }))

    // Insert vote
    const { error: voteError } = await supabase.from('votes').insert([{
      platform_id: platformId,
      user_id:     userId,
      vote_type:   voteType,
    }])
    if (voteError) {
      setUserVotes(v => { const n={...v}; delete n[platformId]; return n })
      return { error: voteError }
    }

    // Update platform counts
    await supabase.from('platforms').update({
      upvotes:   voteType === 'up'   ? currentUpvotes + 1   : currentUpvotes,
      downvotes: voteType === 'down' ? currentDownvotes + 1 : currentDownvotes,
    }).eq('id', platformId)

    return { error: null }
  }

  return { userVotes, castVote }
}

// ─── REVIEWS HOOK ─────────────────────────────────────────────────────────────
export function useReviews(platformId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!platformId) return
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('platform_id', platformId)
      .is('parent_id', null)       // top-level reviews only
      .order('created_at', { ascending: false })
    // Fetch replies for each review
    if (data) {
      const withReplies = await Promise.all(data.map(async (review) => {
        const { data: replies } = await supabase
          .from('reviews')
          .select('*')
          .eq('parent_id', review.id)
          .order('created_at', { ascending: true })
        return { ...review, replies: replies || [] }
      }))
      setReviews(withReplies)
    }
    setLoading(false)
  }, [platformId])

  useEffect(() => {
    fetch()
    if (!platformId) return
    const channel = supabase
      .channel(`reviews-${platformId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `platform_id=eq.${platformId}` }, () => fetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [platformId, fetch])

  const addReview = async ({ platformId, userId, username, avatar, rating, text }) => {
    const { data, error } = await supabase.from('reviews').insert([{
      platform_id: platformId,
      user_id:     userId,
      username, avatar, rating, text,
    }]).select().single()
    if (!error) fetch()
    return { data, error }
  }

  const addReply = async ({ parentId, platformId, userId, username, avatar, text }) => {
    const { data, error } = await supabase.from('reviews').insert([{
      parent_id:   parentId,
      platform_id: platformId,
      user_id:     userId,
      username, avatar,
      rating:      0,
      text,
    }]).select().single()
    if (!error) fetch()
    return { data, error }
  }

  const likeReview = async (reviewId, userId, currentLikes) => {
    // Check if already liked
    const { data: existing } = await supabase.from('review_likes')
      .select('id').eq('review_id', reviewId).eq('user_id', userId).single()
    if (existing) return

    await supabase.from('review_likes').insert([{ review_id: reviewId, user_id: userId }])
    await supabase.from('reviews').update({ likes: currentLikes + 1 }).eq('id', reviewId)
    fetch()
  }

  return { reviews, loading, addReview, addReply, likeReview, refetch: fetch }
}

// ─── ALL REVIEWS (for platform list / previews) ───────────────────────────────
export function useAllReviewPreviews(platformIds) {
  const [previews, setPreviews] = useState({}) // { platformId: [review, review] }

  useEffect(() => {
    if (!platformIds?.length) return
    const fetch = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('platform_id, id, username, avatar, rating, text, created_at')
        .in('platform_id', platformIds)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
      if (data) {
        const map = {}
        data.forEach(r => {
          if (!map[r.platform_id]) map[r.platform_id] = []
          if (map[r.platform_id].length < 2) map[r.platform_id].push(r)
        })
        setPreviews(map)
      }
    }
    fetch()
  }, [platformIds?.join(',')])

  return { previews }
}
