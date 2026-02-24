'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
    Heart,
    MessageCircle,
    Send,
    Sparkles,
    Users,
    Clock,
    Loader2,
    AlertCircle
} from 'lucide-react'

/* ================= TYPES ================= */
interface CommunityPost {
    id: string
    content: string
    created_at: string
    user_id: string
    likes: number
    username?: string
}

/* ================= HELPERS ================= */
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const AVATAR_GRADIENTS = [
    'from-purple-500 to-pink-500',
    'from-rose-500 to-amber-400',
    'from-violet-500 to-indigo-500',
    'from-fuchsia-500 to-rose-500',
    'from-pink-500 to-purple-600',
    'from-indigo-400 to-purple-500',
    'from-rose-400 to-pink-600',
]

function avatarGradient(name: string) {
    const index = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length
    return AVATAR_GRADIENTS[index]
}

/* ================= COMPONENT ================= */
export default function CommunityPage() {
    const [posts, setPosts] = useState<CommunityPost[]>([])
    const [newPost, setNewPost] = useState('')
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    /* -------- Auth -------- */
    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (data.user) {
                setUserId(data.user.id)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', data.user.id)
                    .single()
                if (profile?.username) setUserName(profile.username)
            }
        })
    }, [])

    /* -------- Fetch posts + usernames separately -------- */
    const fetchPosts = useCallback(async () => {
        try {
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select('id, content, created_at, user_id, likes')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(50)

            if (postsError) {
                console.warn('Posts fetch error:', postsError.message)
                setError('Unable to load community posts.')
                setLoading(false)
                return
            }

            const rawPosts = postsData || []

            if (rawPosts.length === 0) {
                setPosts([])
                setLoading(false)
                return
            }

            // Get unique user IDs and fetch their usernames
            const userIds = [...new Set(rawPosts.map(p => p.user_id))]
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds)

            const usernameMap = new Map<string, string>()
            if (profilesData) {
                profilesData.forEach(p => usernameMap.set(p.id, p.username || 'Anonymous'))
            }

            // Merge usernames into posts
            const enrichedPosts: CommunityPost[] = rawPosts.map(p => ({
                ...p,
                username: usernameMap.get(p.user_id) || 'Anonymous'
            }))

            setPosts(enrichedPosts)
            setError(null)
        } catch (err) {
            console.warn('Community fetch failed:', err)
            setError('Unable to load community posts.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    /* -------- Real-time subscription -------- */
    useEffect(() => {
        const channel = supabase
            .channel('community-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'community_posts' },
                () => { fetchPosts() }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchPosts])

    /* -------- Submit post -------- */
    const handlePost = async () => {
        if (!newPost.trim() || posting || !userId) return

        setPosting(true)
        setError(null)

        const { error: insertError } = await supabase.from('community_posts').insert([
            { user_id: userId, content: newPost.trim() }
        ])

        if (insertError) {
            setError('Failed to post. Please try again.')
            console.warn('Post insert error:', insertError.message)
        } else {
            setNewPost('')
            if (textareaRef.current) textareaRef.current.style.height = 'auto'
            await fetchPosts()
        }

        setPosting(false)
    }

    /* -------- Like post -------- */
    const handleLike = async (postId: string) => {
        if (!userId || likedPosts.has(postId)) return

        setLikedPosts(prev => new Set(prev).add(postId))

        // Optimistic update
        setPosts(prev =>
            prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)
        )

        const { error } = await supabase.rpc('increment_post_likes', { post_id: postId })
        if (error) {
            console.warn('Like failed:', error.message)
        }
    }

    /* -------- Auto-resize textarea -------- */
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewPost(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-purple-50/50 to-pink-50/60 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-[100px] animate-[drift_22s_ease-in-out_infinite_alternate]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-pink-200/30 blur-[100px] animate-[drift_28s_ease-in-out_infinite_alternate-reverse]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">

                {/* -------- Header -------- */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-1.5 border border-purple-100/50 shadow-sm mb-4">
                        <Users size={14} className="text-purple-500" />
                        <span className="text-xs font-medium text-purple-600">Women Supporting Women</span>
                    </div>

                    <h1 className="text-3xl font-semibold text-gray-800 tracking-tight mb-2">
                        Community
                    </h1>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        A safe, supportive space to share your experiences. You&apos;re not alone in this journey. 💜
                    </p>
                </motion.div>

                {/* -------- Compose -------- */}
                {userId ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-purple-100/50 shadow-sm mb-8"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(userName || 'U')} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                                {(userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    ref={textareaRef}
                                    value={newPost}
                                    onChange={handleTextareaChange}
                                    placeholder="Share how you're feeling today..."
                                    rows={2}
                                    maxLength={500}
                                    className="w-full bg-transparent text-gray-700 placeholder-gray-400 resize-none outline-none text-sm leading-relaxed"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost()
                                    }}
                                />
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <span className={`text-xs ${newPost.length > 450 ? 'text-rose-500' : 'text-gray-400'}`}>
                                        {newPost.length}/500
                                    </span>
                                    <button
                                        onClick={handlePost}
                                        disabled={posting || !newPost.trim()}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {posting ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Send size={14} />
                                        )}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-2xl p-6 border border-purple-100/50 text-center mb-8"
                    >
                        <Sparkles size={20} className="text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-3">Sign in to share your experience with the community</p>
                        <a
                            href="/auth"
                            className="inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:shadow-md transition"
                        >
                            Sign In
                        </a>
                    </motion.div>
                )}

                {/* -------- Error -------- */}
                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-xl mb-4 border border-rose-100">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* -------- Posts Feed -------- */}
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-20">
                        <Loader2 size={28} className="text-purple-400 animate-spin" />
                        <p className="text-sm text-gray-400">Loading community posts…</p>
                    </div>
                ) : posts.length === 0 && !error ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <MessageCircle size={36} className="text-purple-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No posts yet. Be the first to share! 🌸</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {posts.map((post, i) => {
                                const displayName = post.username || 'Anonymous'
                                const isOwnPost = post.user_id === userId
                                const alreadyLiked = likedPosts.has(post.id)

                                return (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.03, duration: 0.35 }}
                                        className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-purple-100/40 shadow-sm hover:shadow-md transition-shadow duration-300"
                                    >
                                        {/* Post header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(displayName)} flex items-center justify-center text-white font-semibold text-xs`}>
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {displayName}
                                                    {isOwnPost && (
                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-normal">
                                                            You
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock size={11} />
                                                    {timeAgo(post.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Post content */}
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                                            {post.content}
                                        </p>

                                        {/* Post actions */}
                                        <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                                            <button
                                                onClick={() => handleLike(post.id)}
                                                disabled={!userId || alreadyLiked}
                                                className={`flex items-center gap-1.5 text-xs font-medium transition-all ${alreadyLiked
                                                        ? 'text-rose-500'
                                                        : 'text-gray-400 hover:text-rose-500'
                                                    } disabled:cursor-default`}
                                            >
                                                <Heart
                                                    size={15}
                                                    className={`transition-transform ${alreadyLiked ? 'fill-rose-500 scale-110' : 'hover:scale-110'}`}
                                                />
                                                {(post.likes || 0) > 0 && (
                                                    <span>{post.likes}</span>
                                                )}
                                                <span className="ml-0.5">Support</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* -------- Footer note -------- */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-12 mb-8"
                >
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                        This is a supportive community space. Be kind, be compassionate. Your personal health data is never shared. 💜
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
