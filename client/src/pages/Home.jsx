import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import { VideoCard, SkeletonGrid } from '../components/VideoCard.jsx';
import { api } from '../lib/api.js';
import { IconPlay, IconTicket, IconSparkle, IconVideo, IconBook, IconArrowRight } from '../components/Icons.jsx';

export default function Home() {
  const [videos, setVideos] = useState(null);

  useEffect(() => {
    api.get('/api/videos').then((r) => setVideos(r.data)).catch(() => setVideos([]));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <Reveal>
          <div className="hero-badge"><IconSparkle width="14" height="14" /> 系统化课程 · 兑换解锁 · 随时回看</div>
          <h1>拾光学院</h1>
          <p className="sub">
            精心打磨的系列网课，带你系统掌握新技能。
            浏览课程、兑换解锁、即刻开课。
          </p>
          <div className="hero-actions">
            <Link to="/courses" className="btn lg">浏览课程 <IconArrowRight width="17" height="17" /></Link>
            <Link to="/redeem" className="btn lg secondary">兑换课程 <IconTicket width="17" height="17" /></Link>
          </div>
        </Reveal>
      </section>

      {/* 特性 */}
      <section className="section">
        <div className="container">
          <Reveal className="sec-head">
            <h2>为什么选择拾光学院</h2>
            <p>极简的学习体验，专注内容本身</p>
          </Reveal>
          <div className="feature-row">
            <Reveal delay={0}>
              <div className="feature-item">
                <div className="feature-icon"><IconVideo /></div>
                <h3>高质量课程</h3>
                <p>每门课程都经过系统编排，从基础到进阶循序渐进，内容精炼不注水。</p>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="feature-item">
                <div className="feature-icon"><IconTicket /></div>
                <h3>兑换码解锁</h3>
                <p>无需复杂注册，使用兑换码即可解锁对应课程，开通即刻观看，纯净无打扰。</p>
              </div>
            </Reveal>
            <Reveal delay={2}>
              <div className="feature-item">
                <div className="feature-icon"><IconBook /></div>
                <h3>随时回看</h3>
                <p>解锁后在有效期内可反复观看，进度自由，手机平板电脑全端自适应。</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 精选课程 */}
      <section className="section section-alt">
        <div className="container">
          <Reveal className="sec-head">
            <h2>精选课程</h2>
            <p>先从这些开始你的学习之旅</p>
          </Reveal>
          {videos === null ? (
            <SkeletonGrid n={3} />
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <IconPlay width="44" height="44" />
              <p>课程即将上线，敬请期待</p>
            </div>
          ) : (
            <>
              <div className="grid-courses">
                {videos.slice(0, 3).map((v, i) => (
                  <VideoCard key={v.id} video={v} index={i} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 44 }}>
                <Link to="/courses" className="btn secondary">查看全部课程</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 三步流程（深色） */}
      <section className="section dark-band">
        <div className="container">
          <Reveal className="sec-head">
            <h2>三步开始学习</h2>
            <p>简单直接，一分钟内开始上课</p>
          </Reveal>
          <div className="steps">
            <Reveal delay={0}><div className="step">
              <h3>浏览课程</h3>
              <p>在课程列表中找到感兴趣的课程，查看简介与试看片段。</p>
            </div></Reveal>
            <Reveal delay={1}><div className="step">
              <h3>兑换解锁</h3>
              <p>输入兑换码，对应课程立即解锁，无需注册账号。</p>
            </div></Reveal>
            <Reveal delay={2}><div className="step">
              <h3>立即观看</h3>
              <p>解锁后在有效期内自由观看全部内容，进度随时保存。</p>
            </div></Reveal>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="section" style={{ paddingBottom: 120 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-.02em', marginBottom: 14 }}>
              准备好了吗？
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 18, marginBottom: 34 }}>立即开启你的学习之旅</p>
            <Link to="/courses" className="btn lg">开始学习 <IconArrowRight width="17" height="17" /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
