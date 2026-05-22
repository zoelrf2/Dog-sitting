import React, { useState } from 'react';
import { DiscussionEmbed } from 'disqus-react';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  PlusCircle,
  Share2,
  Bold,
  Italic,
  Link,
  Image as ImageIcon,
  Sparkles,
  Search,
  BookOpen,
  Calendar,
  ShieldCheck,
  User,
  MoreHorizontal,
  Flame,
  ArrowRight,
  Smile,
  Globe,
  Star
} from 'lucide-react';
import { SocialPost, DisqusComment } from '../types';

// DisqusForum class component allowing literal usage of the requested snippet structure:
class DisqusForum extends React.Component<{ article: { url: string; id: string; title: string } }> {
  props: { article: { url: string; id: string; title: string } };

  constructor(props: { article: { url: string; id: string; title: string } }) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <DiscussionEmbed
        shortname="dog-sitting"
        config={{
          url: this.props.article.url,
          identifier: this.props.article.id,
          title: this.props.article.title,
          language: 'zh_TW' //e.g. for Traditional Chinese (Taiwan)
        }}
      />
    );
  }
}

interface SocialViewProps {
  posts: SocialPost[];
  comments: DisqusComment[];
  userEmail: string;
  userRole: 'owner' | 'sitter';
  ownerName: string;
  sitterName: string;
  onAddPost: (title: string, content: string, category: string) => void;
  onAddComment: (content: string, parentId: string | null) => void;
  onVoteComment: (commentId: string, direction: 'up' | 'down') => void;
  onLikePost: (postId: string) => void;
}

export default function SocialView({
  posts,
  comments,
  userEmail,
  userRole,
  ownerName,
  sitterName,
  onAddPost,
  onAddComment,
  onVoteComment,
  onLikePost
}: SocialViewProps) {
  // Navigation & Category states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePostForDisqus, setActivePostForDisqus] = useState<string>('general');
  const [searchPostQuery, setSearchPostQuery] = useState('');
  
  // Post Form State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General Discussion');

  // Disqus Comment State
  const [rootCommentInput, setRootCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [forumMode, setForumMode] = useState<'disqus' | 'local'>('disqus');

  // Current active name and avatar calculation
  const currentUserName = userRole === 'owner' ? (ownerName || 'Friendly Owner') : (sitterName || 'Expert Sitter');
  const currentUserAvatar = userRole === 'owner' ? '🐶' : '👩‍💼';

  const categories = [
    'All Topics',
    'General Discussion',
    'Care & Nutrition 🩺',
    'Local Dog Meetups 🥾',
    'Lost & Found Alerts 🚨',
    'Funny Playdate Moments 📸'
  ];

  // Filters posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All Topics' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchPostQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchPostQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    onAddPost(newPostTitle, newPostContent, newPostCategory);
    setNewPostTitle('');
    setNewPostContent('');
    setShowCreatePost(false);
  };

  const handleCommentSubmit = (e: React.FormEvent, parentId: string | null) => {
    e.preventDefault();
    const content = parentId ? replyInput : rootCommentInput;
    if (!content.trim()) return;

    onAddComment(content, parentId);
    if (parentId) {
      setReplyInput('');
      setReplyingToId(null);
    } else {
      setRootCommentInput('');
    }
  };

  // Helper to inject Markdown format symbols inside Input Textarea
  const injectTextHelper = (symbol: string, isReply: boolean) => {
    if (isReply) {
      setReplyInput(prev => prev + ` ${symbol} `);
    } else {
      setRootCommentInput(prev => prev + ` ${symbol} `);
    }
  };

  // Sort comments based on state
  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (commentSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return (b.likes - b.dislikes) - (a.likes - a.dislikes); // Popular
  });

  // Nest comments structure: map parentholder list
  const parentComments = sortedComments.filter(com => !com.parentId);
  
  // Recursively render comments helper
  const renderCommentTree = (comment: DisqusComment, depth = 0) => {
    const childComments = sortedComments.filter(child => child.parentId === comment.id);
    const score = comment.likes - comment.dislikes;
    const isReplying = replyingToId === comment.id;

    // Role badge
    let badgeColor = 'bg-slate-100 text-slate-600';
    if (comment.authorRole === 'moderator') {
      badgeColor = 'bg-red-100 text-red-700 font-extrabold';
    } else if (comment.authorRole === 'sitter') {
      badgeColor = 'bg-violet-100 text-violet-700 font-bold';
    } else if (comment.authorRole === 'owner') {
      badgeColor = 'bg-fuchsia-100 text-fuchsia-700 font-bold';
    }

    return (
      <div key={comment.id} className={`relative pt-4 text-left ${depth > 0 ? 'ml-6 sm:ml-12 mt-2 border-l-2 border-slate-100 pl-4' : 'border-t border-slate-100 mt-4'}`}>
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 select-none">
            {comment.authorAvatar || '🐶'}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-black text-slate-800 font-sans">{comment.authorName}</span>
              <span className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full ${badgeColor}`}>
                {comment.authorRole}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Comment Content */}
            <p className="text-xs text-slate-700 mt-1.5 font-medium whitespace-pre-wrap leading-relaxed bg-white/40 p-2.5 rounded-xl border border-slate-50">
              {comment.content}
            </p>

            {/* Actions Bar */}
            <div className="flex items-center space-x-4 mt-2 text-slate-400 font-mono text-[10px] font-bold">
              <button
                onClick={() => onVoteComment(comment.id, 'up')}
                className="flex items-center space-x-1 hover:text-emerald-500 transition cursor-pointer"
                title="Upvote comment"
              >
                <ThumbsUp className="h-3 w-3" />
                <span>{comment.likes}</span>
              </button>

              <button
                onClick={() => onVoteComment(comment.id, 'down')}
                className="flex items-center space-x-1 hover:text-rose-500 transition cursor-pointer"
                title="Downvote comment"
              >
                <ThumbsDown className="h-3 w-3" />
                <span>{comment.dislikes}</span>
              </button>

              <div className="h-3 w-[1px] bg-slate-200"></div>

              <button
                onClick={() => {
                  setReplyingToId(isReplying ? null : comment.id);
                  setReplyInput('');
                }}
                className={`hover:text-violet-600 transition cursor-pointer flex items-center space-x-1 ${isReplying ? 'text-violet-600' : ''}`}
              >
                <MessageCircle className="h-3 w-3" />
                <span>Reply</span>
              </button>

              <span className="text-slate-300 hidden sm:inline">•</span>

              <button 
                onClick={() => alert(`Link copied: [Disqus Comment #${comment.id}]`)}
                className="hover:text-slate-600 transition hidden sm:inline cursor-pointer"
              >
                Share
              </button>
            </div>

            {/* Inline Nesting Reply Text Box */}
            {isReplying && (
              <form onSubmit={(e) => handleCommentSubmit(e, comment.id)} className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-fade-in text-left">
                <div className="flex items-start space-x-2">
                  <span className="text-sm select-none mt-1">↩️</span>
                  <div className="flex-1">
                    <textarea
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder={`Reply to ${comment.authorName}...`}
                      rows={2}
                      className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 focus:border-violet-500 rounded-xl p-2 outline-none resize-none transition"
                    />

                    {/* Editor Mini Toolbar styled after Disqus */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => injectTextHelper('**Bold**', true)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Bold Text"
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => injectTextHelper('*Italic*', true)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Italic Text"
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => injectTextHelper('[Link Title](https://example.com)', true)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Add URL Link"
                        >
                          <Link className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => injectTextHelper('📸 [Dog Image URL]', true)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Add Dog Image Placeholder"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-650 px-2 py-1 rounded transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!replyInput.trim()}
                          className="bg-violet-600 hover:bg-violet-750 text-white font-mono text-[10px] uppercase font-black px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Send className="h-2.5 w-2.5" />
                          <span>Submit Reply</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </form>
            )}

            {/* Recursive children renders */}
            {childComments.map(child => renderCommentTree(child, depth + 1))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 text-slate-700">
      
      {/* Community Banner */}
      <div className="bg-gradient-to-tr from-violet-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 select-none text-9xl">
          💬
        </div>
        
        <div className="max-w-2xl text-left space-y-3.5 relative z-10">
          <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-300 animate-spin" /> Live Synchronized Neighborhood Exchange
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            BarkSitter Neighborhood Social Hub
          </h2>
          <p className="text-xs sm:text-sm text-violet-100 font-medium leading-relaxed">
            Welcome to the social exchange! Meet nearby pet heroes, share funny playdate captures, review grooming locations, and participate in lively neighborhood conversations synced instantly in real-time.
          </p>
          
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-white hover:bg-slate-50 text-violet-700 font-sans text-xs font-black px-4.5 py-2.5 rounded-xl shadow-sm hover:scale-[1.02] transition cursor-pointer flex items-center space-x-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Share Community Moment</span>
            </button>
            <a
              href="#disqus-embed-forum"
              className="bg-violet-500/30 hover:bg-violet-500/50 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition flex items-center space-x-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Go to Disqus Forum</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Categories Navigation & Posting Feed */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Categories Horizontal Scroller & Search bar */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category selection */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.slice(0, 4).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 bg-slate-50'
                  }`}
                >
                  {cat === 'All Topics' ? '🌎 All Topics' : cat}
                </button>
              ))}
            </div>

            {/* Keyword searching */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search social posts..."
                value={searchPostQuery}
                onChange={(e) => setSearchPostQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-violet-500 transition w-full md:w-48"
              />
            </div>
          </div>

          {/* Social posting entry dialog modal */}
          {showCreatePost && (
            <div className="bg-white border-2 border-violet-100 rounded-3xl p-5 text-left space-y-4 animate-fade-in shadow-md">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-1.5">
                  <span>🐕</span>
                  <span>Compose New Community Discussion Post</span>
                </h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-slate-400 hover:text-slate-650 text-xs font-bold font-mono"
                >
                  [Close]
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Post Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., greenwood park playdate schedules?"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="mt-1 w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-violet-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Choose Topic</label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="mt-1 w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="General Discussion">General Discussion</option>
                      <option value="Care & Nutrition 🩺">Care & Nutrition 🩺</option>
                      <option value="Local Dog Meetups 🥾">Local Dog Meetups 🥾</option>
                      <option value="Lost & Found Alerts 🚨">Lost & Found Alerts 🚨</option>
                      <option value="Funny Playdate Moments 📸">Funny Playdate Moments 📸</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Discussion Content</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write details of what you would like to discuss with parents and sitters..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mt-1 w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl p-3 outline-none focus:bg-white focus:border-violet-500 transition resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePost(false)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white text-xs font-black px-5 py-2 rounded-xl transition shadow-md shadow-violet-600/10 cursor-pointer"
                  >
                    Post Live to Feed
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Social posting lists rendering */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white border border-slate-150 rounded-3xl p-10 text-center text-slate-450">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto animate-bounce mb-2" />
                <p className="font-extrabold text-slate-700 text-sm">No community moments found</p>
                <p className="text-xs text-slate-400 mt-1">Be the very first caregiver or owner to post in this category!</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-md transition duration-300 text-left space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* User Profile info */}
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-lg shadow-inner select-none font-sans">
                        {post.authorAvatar || '🐶'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-800">{post.authorName}</span>
                          <span className="text-[8px] uppercase tracking-widest font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-extrabold">
                            {post.authorRole}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Posted {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Tag badge */}
                    <span className="text-[9px] font-bold text-violet-600 font-mono bg-violet-50 px-2.5 py-1 rounded-xl block">
                      {post.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight font-sans">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Actions line row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-slate-400 font-mono text-[10px] font-bold">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => onLikePost(post.id)}
                        className="flex items-center space-x-1.5 hover:text-rose-500 transition bg-slate-50 px-2.5 py-1 rounded-lg cursor-pointer"
                        title="Like this post"
                      >
                        <span className="text-sm">❤️</span>
                        <span>{post.likes}</span>
                      </button>

                      <a 
                        href="#disqus-embed-forum"
                        className="flex items-center space-x-1.5 hover:text-violet-600 transition bg-slate-50 px-2.5 py-1 rounded-lg cursor-pointer"
                        title="Scroll to comment forum"
                        onClick={() => {
                          setActivePostForDisqus(post.id);
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Discuss</span>
                      </a>
                    </div>

                    <button
                      onClick={() => {
                        const postUrl = window.location.href;
                        navigator.clipboard.writeText(postUrl);
                        alert('🐾 Link copied to clipboard! Share details with neighborhood pet groups.');
                      }}
                      className="hover:text-slate-700 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>Share Post</span>
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

        {/* Right column: Social sidebar details */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          {/* Active status card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <span>👤</span> Your Social Persona
            </h4>

            <div className="flex items-center space-x-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-150/60">
              <span className="text-3xl select-none">{currentUserAvatar}</span>
              <div>
                <h5 className="text-xs font-extrabold text-slate-800">{currentUserName}</h5>
                <p className="text-[10px] text-slate-400 font-mono">{userEmail}</p>
                <span className="inline-block mt-1 text-[8px] bg-violet-600 text-white font-mono uppercase px-2 py-0.5 rounded">
                  {userRole} account
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              When you submit posts or comments, your active verified persona helps local pet owners and sitters easily find and cross-reference you!
            </p>
          </div>

          {/* Guidelines info board */}
          <div className="bg-gradient-to-tr from-fuchsia-50/60 to-violet-50/60 border border-violet-100 rounded-3xl p-5 space-y-3.5">
            <h4 className="text-xs font-black uppercase text-purple-600 font-mono tracking-wider">
              🛡️ Safe Social Committment
            </h4>
            <ul className="space-y-2 text-[11px] text-purple-900/80 font-medium leading-relaxed">
              <li className="flex items-start gap-1">
                <span className="text-xs">📍</span>
                <span>Keep meetups in public local parks (e.g., Greenwood Off-Leash).</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-xs">🛡️</span>
                <span>Only book pet sits through the verified portal map.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-xs">⭐</span>
                <span>Respect everyone in the comment threads below. No spamming.</span>
              </li>
            </ul>
          </div>

          {/* Quick neighborhood stats */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
              📊 Social Hub Vitality
            </h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50 p-3 rounded-2xl flex flex-col justify-center">
                <span className="text-xl font-black text-slate-800 font-mono">{posts.length}</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-extrabold mt-0.5">Posts Shared</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl flex flex-col justify-center">
                <span className="text-xl font-black text-slate-800 font-mono">{comments.length}</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-extrabold mt-0.5">Disqus Comments</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* DISQUS EMBED FORUM AT THE BOTTOM OF THE WEBPAGE */}
      <div id="disqus-embed-forum" className="scroll-mt-24 pt-12 border-t border-slate-200">
        
        {/* Core Disqus Forum Wrapper Styled to replicate the real Disqus embed widget */}
        <div id="disqus_thread" className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
          
          {/* Header row modeled after Disqus */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-100 text-left gap-3">
            <div className="flex items-center space-x-2.5">
              {/* Fake Disqus Signature Style Bubble "D" Logo */}
              <div className="bg-[#2e9fff] text-white font-black text-base italic h-7 w-7 rounded-md flex items-center justify-center select-none shadow-xs font-serif tracking-tighter" title="Disqus Verified Forum">
                D
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 font-sans tracking-tight">
                  BarkSitter Neighborhood Channel
                </h3>
                <span className="text-[9px] text-[#2e9fff] font-mono tracking-widest font-extrabold uppercase block mt-0.5">
                  ⚡ DISQUS REAL-TIME INTERACTION
                </span>
              </div>
            </div>

            {/* Switch Tabs between Real Disqus (using live disqus-react) and Offline backup sync */}
            <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setForumMode('disqus')}
                className={`text-[11px] font-extrabold px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  forumMode === 'disqus'
                    ? 'bg-[#2e9fff] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🌐</span> Live Disqus Embed
              </button>
              <button
                type="button"
                onClick={() => setForumMode('local')}
                className={`text-[11px] font-extrabold px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  forumMode === 'local'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>💬</span> Neighborhood Chat ({comments.length})
              </button>
            </div>
          </div>

          {forumMode === 'disqus' ? (
            <div className="space-y-6 text-left">
              {/* Sandbox info popup alert */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-150 text-xs text-amber-800 flex items-start gap-2.5">
                <span className="text-base select-none">ℹ️</span>
                <div className="space-y-1">
                  <p className="font-extrabold text-amber-900">Custom Integration: disqus-react</p>
                  <p className="text-[11.5px] text-amber-800/90 leading-relaxed">
                    We loaded the official <strong>DiscussionEmbed</strong> using shortname <code>'dog-sitting'</code> and Traditional Chinese (Taiwan) <code>'zh_TW'</code> configuration matching your codebase requirement.
                  </p>
                  <p className="text-[11px] text-amber-700/80 leading-relaxed">
                    *Note: If the inner frame stays blank, it is due to standard browser cookie/hosting requirements inside secure previews. Open the application in a <strong>new tab</strong> to test full third-party syncing!
                  </p>
                </div>
              </div>

              {/* Real integrated Disqus Embed */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-inner">
                <DisqusForum
                  article={{
                    url: window.location.origin + window.location.pathname + '#disqus-embed-forum',
                    id: activePostForDisqus || 'general',
                    title: posts.find(p => p.id === activePostForDisqus)?.title || 'BarkSitter Neighborhood Forum'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Top-right links / controls */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                <span>LOCAL BACKUP THREAD</span>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => alert('❤️ Community Favorite! Thank you for recommending this neighborhood channel.')}
                    className="hover:text-amber-500 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                    <span>Recommend</span>
                  </button>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-350">Sort by</span>
                    <select
                      value={commentSort}
                      onChange={(e) => setCommentSort(e.target.value as any)}
                      className="bg-transparent border-none text-slate-600 font-bold outline-none cursor-pointer text-[11px]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Most Liked</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Disqus editor Box */}
              <div className="mt-6 flex items-start space-x-4 text-left">
                {/* Logged user avatar left */}
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xl shrink-0 select-none shadow-inner">
                  {currentUserAvatar}
                </div>

                {/* Textarea comment box */}
                <div className="flex-1 min-w-0">
                  <form onSubmit={(e) => handleCommentSubmit(e, null)} className="border border-slate-250 focus-within:border-[#2e9fff] rounded-2xl bg-slate-50/70 focus-within:bg-white transition-all overflow-hidden">
                    <textarea
                      value={rootCommentInput}
                      onChange={(e) => setRootCommentInput(e.target.value)}
                      placeholder="Start the discussion... Join the BarkSitter circle!"
                      rows={3}
                      className="w-full text-xs sm:text-sm font-medium text-slate-700 bg-transparent p-4 outline-none resize-none placeholder-slate-400 leading-relaxed"
                    />

                    {/* Disqus Formatting toolbar bottom row */}
                    <div className="bg-slate-100/80 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => injectTextHelper('**Bold**', false)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Bold text"
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => injectTextHelper('*Italic*', false)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Italic text"
                        >
                          <Italic className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => injectTextHelper('[Link Title](https://example.com)', false)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Add web URL"
                        >
                          <Link className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => injectTextHelper('📸 [Dog Photo URL]', false)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                          title="Add dog image URL"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center space-x-2">
                        <span className="hidden md:inline text-[9px] text-slate-400 font-mono tracking-wider">
                          Posting as <span className="font-bold text-slate-500">{currentUserName}</span>
                        </span>
                        <button
                          type="submit"
                          disabled={!rootCommentInput.trim()}
                          className="bg-[#2e9fff] hover:bg-[#1b8eec] disabled:opacity-45 text-white font-mono text-[10px] sm:text-xs uppercase font-extrabold px-4.5 py-2.5 rounded-xl transition shadow-md shadow-[#2e9fff]/10 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          <span>Post Comment</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Bottom agreement clause */}
                  <p className="text-[9px] text-slate-400 mt-1.5 text-right italic font-medium">
                    By posting, you agree to the BarkSitter Disqus moderation community rules.
                  </p>
                </div>
              </div>

              {/* Disqus Comments threaded display listing */}
              <div className="mt-8 space-y-4">
                {parentComments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm font-extrabold text-slate-705">No comments in this thread yet.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Start the conversation! What are your thoughts on local dog sitting?</p>
                  </div>
                ) : (
                  parentComments.map(com => renderCommentTree(com, 0))
                )}
              </div>

              {/* Disqus copyright info branding */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="hover:text-slate-600 transition flex items-center gap-1">
                  <Globe className="h-3 w-3 text-slate-300" />
                  <span>English (US)</span>
                </span>
                <div className="flex space-x-3">
                  <a href="https://disqus.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition font-bold text-[#2e9fff]">Disqus</a>
                  <span>•</span>
                  <a href="#" className="hover:text-slate-600 transition">Privacy</a>
                  <span>•</span>
                  <a href="#" className="hover:text-slate-600 transition">Terms</a>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
