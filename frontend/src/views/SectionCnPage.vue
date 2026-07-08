<template>
  <div class="section-page">
    <!-- Header -->
    <div class="page-header">
      <div class="container">
        <router-link :to="isDemo ? '/' : '/my-cn'" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          {{ isDemo ? 'กลับหน้าหลัก' : 'กลับ' }}
        </router-link>
        <div v-if="section" class="header-info">
          <span class="sec-code-badge">{{ section.code }}</span>
          <h1>{{ section.name }}</h1>
          <p v-if="section.description">{{ section.description }}</p>
          <div class="header-meta">
            <span>{{ section.videos.length }} บทเรียน</span>
            <span v-if="topicCount">{{ topicCount }} หมวด</span>
            <span v-if="overallProgress.totalDuration">{{ formatTotalDuration(overallProgress.totalDuration) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container sec-content">
      <!-- Loading -->
      <div v-if="activationStore.loading" class="loading-state">
        <div v-for="i in 5" :key="i" class="skeleton" style="height: 60px; margin-bottom: 10px"></div>
      </div>

      <!-- Error -->
      <div v-else-if="activationStore.error" class="alert alert-error">
        {{ activationStore.error }}
        <router-link :to="isDemo ? '/' : '/my-cn'" class="btn btn-sm btn-outline" style="margin-left: auto">กลับ</router-link>
      </div>

      <!-- Overall Progress -->
      <div v-if="section && !activationStore.loading && !isDemo" class="overall-progress">
        <div class="op-info">
          <span class="op-label">ความคืบหน้า</span>
          <span class="op-stats">{{ overallProgress.watched }}/{{ overallProgress.total }} บทเรียน ({{ overallProgress.pct }}%)</span>
        </div>
        <div class="op-bar">
          <div class="op-fill" :style="{ width: overallProgress.pct + '%' }"></div>
        </div>
      </div>

      <!-- Video list -->
      <div v-if="section" class="video-list">
        <template v-for="(topic, ti) in hierarchicalTopics" :key="ti">

          <!-- Topic Section -->
          <div class="topic-section">
            <!-- Topic Header -->
            <div v-if="topic.name" class="topic-header">
              <div class="topic-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
              </div>
              <div class="topic-info">
                <span class="topic-name">{{ topic.name }}</span>
                <span class="topic-meta">{{ topic.totalCount }} บทเรียน<span v-if="topic.totalDuration"> &bull; {{ formatTotalDuration(topic.totalDuration) }}</span></span>
              </div>
              <div class="topic-progress-badge" v-if="!isDemo">{{ topic.watchedCount }}/{{ topic.totalCount }}</div>
              <button
                v-if="!isDemo && topicSelfCheck(topic)"
                class="self-check-btn"
                :style="{ '--sc-color': topicSelfCheck(topic).color }"
                @click.stop.prevent="openSelfCheck(topicSelfCheck(topic).templateSlug)"
                :title="topicSelfCheck(topic).templateName"
              >
                <span class="sc-icon">{{ topicSelfCheck(topic).icon || '📋' }}</span>
                <span class="sc-label">Self Check</span>
                <span class="sc-percent">{{ topicSelfCheck(topic).percent }}%</span>
              </button>
              <button v-if="section.topicPdfMap && section.topicPdfMap[topic.name] && !isDemo" class="group-pdf-btn topic" @click.stop.prevent="showGroupPdfModal('topic', topic.name)" :disabled="groupPdfLoading === topic.name">
                <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clip-rule="evenodd"/></svg>
                เอกสาร
              </button>
            </div>

            <!-- Topic Content -->
            <div class="topic-content">
              <!-- Direct videos (no subtopic) -->
              <template v-for="v in topic.videos.filter(x => !x.subtopic)" :key="'v'+v.index">
                <!-- เอกสารอย่างเดียว (ไม่มีวิดีโอ แต่มี PDF) -->
                <div v-if="!isVideoRow(v) && v.hasPdf" class="video-row doc-row" @click="showPdfModal(v.index)">
                  <div class="vr-check doc-check">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg>
                  </div>
                  <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:#3b82f6"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title">{{ v.title }}</span>
                    <div class="vr-meta"><span class="vr-doc-label">เอกสาร</span></div>
                  </div>
                  <button class="vr-pdf-download" :disabled="pdfLoading === v.index" @click.stop="showPdfModal(v.index)">
                    <span v-if="pdfLoading === v.index" class="vr-pdf-spinner"></span>
                    <template v-else>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
                      เอกสาร
                    </template>
                  </button>
                </div>
                <!-- โครงเปล่า (ไม่มีวิดีโอ ไม่มี PDF) -->
                <div v-else-if="!isVideoRow(v)" class="video-row placeholder-row">
                  <div class="vr-check placeholder-check">
                    <span>{{ v.index + 1 }}</span>
                  </div>
                  <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:var(--gray-2)"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title" style="color:var(--gray)">{{ v.title || 'เร็วๆ นี้' }}</span>
                    <div class="vr-meta"><span class="vr-placeholder-label">เตรียมเนื้อหา</span></div>
                  </div>
                </div>
                <!-- วิดีโอ LOCK (tier ไม่ถึง) — เห็น title แต่กดไม่ได้ -->
                <div v-else-if="v.locked" class="video-row locked-row">
                  <div class="vr-check locked-check">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                  </div>
                  <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:#cbd5e1"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title locked-title">{{ v.title }}</span>
                    <div class="vr-meta"><span class="vr-tier-badge">ระดับ {{ v.requiredTier }}</span></div>
                  </div>
                </div>
                <!-- CN: วิดีโอยังไม่มี Ali code — เทาไว้ (รออัพโหลด) -->
                <div v-else-if="!hasCnVideo(v)" class="video-row cn-pending">
                  <div class="vr-check">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0114 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 15.5v-6A1.5 1.5 0 013.5 8H4zm2-2a2 2 0 114 0v2H6V6z" clip-rule="evenodd"/></svg>
                  </div>
                  <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:#94a3b8"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title cn-pending-title">{{ v.title }}</span>
                    <div class="vr-meta"><span class="cn-pending-badge">รออัพโหลด</span></div>
                  </div>
                </div>
                <!-- วิดีโอปกติ (unlocked + มี Ali code) -->
                <router-link
                  v-else
                  :to="isDemo ? `/demo/watch/${v.index}` : `/my-cn/watch/${section._id}/${v.index}`"
                  class="video-row"
                  :class="{ watched: isWatched(v.index) }"
                >
                  <div class="vr-check" :class="{ done: isWatched(v.index) }">
                    <svg v-if="isWatched(v.index)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
                    <span v-else>{{ v.index + 1 }}</span>
                  </div>
                  <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title">{{ v.title }}</span>
                    <div class="vr-meta">
                      <span class="vr-duration">{{ v.duration || '--:--' }}</span>
                      <span v-if="formatResume(v.index)" class="vr-resume">{{ formatResume(v.index) }}</span>
                    </div>
                  </div>
                  <button v-if="v.hasPdf && !isDemo" class="vr-pdf" :disabled="pdfLoading === v.index" @click.stop.prevent="showPdfModal(v.index)" title="เอกสาร">
                    <span v-if="pdfLoading === v.index" class="vr-pdf-spinner"></span>
                    <template v-else><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg> เอกสาร</template>
                  </button>
                  <div v-if="getProgressPct(v.index) > 0" class="vr-progress"><div class="vr-progress-fill" :style="{ width: getProgressPct(v.index) + '%' }"></div></div>
                </router-link>
                <!-- Bonus LOCK -->
                <div v-if="v.hasBonusVideo && v.bonusLocked" class="video-row bonus-row locked-row">
                  <div class="vr-check bonus-star locked-check">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                  </div>
                  <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:#cbd5e1"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title locked-title">{{ v.bonusLabel || 'VDO เสริม' }}</span>
                    <div class="vr-meta"><span class="vr-tier-badge">ระดับ 6</span></div>
                  </div>
                </div>
                <!-- Bonus Video (มี VDO จริง — unlocked) -->
                <router-link v-else-if="v.hasBonusVideo" :to="isDemo ? `/demo/watch/${v.index}` : `/my-cn/watch/${section._id}/${v.index}?bonus=1`" class="video-row bonus-row">
                  <div class="vr-check bonus-star">&#11088;</div>
                  <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title">{{ v.bonusTitle || 'VDO เสริม' }}</span>
                    <div class="vr-meta">
                      <span class="vr-duration">{{ v.bonusDuration || '--:--' }}</span>
                      <span class="vr-bonus-label">{{ v.bonusLabel || 'เสริม' }}</span>
                    </div>
                  </div>
                  <button v-if="v.bonusHasPdf && !isDemo" class="vr-pdf" @click.stop.prevent="showPdfModal(v.index, true)" title="เอกสาร">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg> เอกสาร
                  </button>
                  <div v-if="getBonusProgressPct(v.index) > 0" class="vr-progress"><div class="vr-progress-fill bonus" :style="{ width: getBonusProgressPct(v.index) + '%' }"></div></div>
                </router-link>
                <!-- Bonus เอกสารอย่างเดียว (ไม่มี VDO) -->
                <div v-else-if="!v.hasBonusVideo && v.hasBonus && v.bonusHasPdf" class="video-row bonus-row doc-row" @click="showPdfModal(v.index, true)">
                  <div class="vr-check bonus-star">&#11088;</div>
                  <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:#f59e0b"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title">{{ v.bonusTitle || v.bonusLabel || 'เอกสารเสริม' }}</span>
                    <div class="vr-meta"><span class="vr-bonus-label">{{ v.bonusLabel || 'เสริม' }}</span> <span class="vr-doc-label">เอกสาร</span></div>
                  </div>
                </div>
                <!-- Bonus placeholder (ไม่มี VDO ไม่มี PDF) -->
                <div v-else-if="!v.hasBonusVideo && v.hasBonus" class="video-row bonus-row placeholder-row">
                  <div class="vr-check bonus-star">&#11088;</div>
                  <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:var(--gray-2)"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                  <div class="vr-info">
                    <span class="vr-title" style="color:var(--gray)">{{ v.bonusTitle || v.bonusLabel || 'เสริม' }}</span>
                    <div class="vr-meta"><span class="vr-placeholder-label">เตรียมเนื้อหา</span></div>
                  </div>
                </div>
              </template>

              <!-- Subtopics -->
              <template v-for="(sub, si) in topic.subtopics" :key="'s'+si">
                <div class="subtopic-header">
                  <div class="subtopic-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
                  </div>
                  <div class="subtopic-info">
                    <span class="subtopic-name">{{ sub.name }}</span>
                    <span class="subtopic-meta">{{ sub.totalCount }} บทเรียน<span v-if="sub.totalDuration"> &bull; {{ formatTotalDuration(sub.totalDuration) }}</span></span>
                  </div>
                  <div class="subtopic-progress-badge" v-if="!isDemo">{{ sub.watchedCount }}/{{ sub.totalCount }}</div>
                  <button
                    v-if="!isDemo && subtopicSelfCheck(sub)"
                    class="self-check-btn subtopic-sc"
                    :style="{ '--sc-color': subtopicSelfCheck(sub).color }"
                    @click.stop.prevent="openSelfCheck(subtopicSelfCheck(sub).templateSlug)"
                    :title="subtopicSelfCheck(sub).templateName"
                  >
                    <span class="sc-icon">{{ subtopicSelfCheck(sub).icon || '📋' }}</span>
                    <span class="sc-label">Self Check</span>
                    <span class="sc-percent">{{ subtopicSelfCheck(sub).percent }}%</span>
                  </button>
                  <button v-if="section.subtopicPdfMap && section.subtopicPdfMap[sub.name] && !isDemo" class="group-pdf-btn subtopic" @click.stop.prevent="showGroupPdfModal('subtopic', sub.name)" :disabled="groupPdfLoading === sub.name">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clip-rule="evenodd"/></svg>
                    เอกสาร
                  </button>
                </div>
                <!-- Subtopic Videos -->
                <template v-for="v in sub.videos" :key="'sv'+v.index">
                  <!-- เอกสารอย่างเดียว (ไม่มีวิดีโอ แต่มี PDF) -->
                  <div v-if="!isVideoRow(v) && v.hasPdf" class="video-row doc-row in-subtopic" @click="showPdfModal(v.index)">
                    <div class="vr-check doc-check">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg>
                    </div>
                    <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:#3b82f6"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title">{{ v.title }}</span>
                      <div class="vr-meta"><span class="vr-doc-label">เอกสาร</span></div>
                    </div>
                    <button class="vr-pdf-download" :disabled="pdfLoading === v.index" @click.stop="showPdfModal(v.index)">
                      <span v-if="pdfLoading === v.index" class="vr-pdf-spinner"></span>
                      <template v-else>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
                        ดาวน์โหลด
                      </template>
                    </button>
                  </div>
                  <!-- โครงเปล่า (ไม่มีวิดีโอ ไม่มี PDF) -->
                  <div v-else-if="!isVideoRow(v)" class="video-row placeholder-row in-subtopic">
                    <div class="vr-check placeholder-check">
                      <span>{{ v.index + 1 }}</span>
                    </div>
                    <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:var(--gray-2)"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title" style="color:var(--gray)">{{ v.title || 'เร็วๆ นี้' }}</span>
                      <div class="vr-meta"><span class="vr-placeholder-label">เตรียมเนื้อหา</span></div>
                    </div>
                  </div>
                  <!-- วิดีโอ LOCK (sub) -->
                  <div v-else-if="v.locked" class="video-row in-subtopic locked-row">
                    <div class="vr-check locked-check">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                    </div>
                    <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:#cbd5e1"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title locked-title">{{ v.title }}</span>
                      <div class="vr-meta"><span class="vr-tier-badge">ระดับ {{ v.requiredTier }}</span></div>
                    </div>
                  </div>
                  <!-- CN: sub วิดีโอยังไม่มี Ali code — เทา -->
                  <div v-else-if="!hasCnVideo(v)" class="video-row in-subtopic cn-pending">
                    <div class="vr-check">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4 8V6a4 4 0 118 0v2h.5A1.5 1.5 0 0114 9.5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 15.5v-6A1.5 1.5 0 013.5 8H4zm2-2a2 2 0 114 0v2H6V6z" clip-rule="evenodd"/></svg>
                    </div>
                    <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:#94a3b8"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title cn-pending-title">{{ v.title }}</span>
                      <div class="vr-meta"><span class="cn-pending-badge">รออัพโหลด</span></div>
                    </div>
                  </div>
                  <!-- วิดีโอปกติ (unlocked, sub, มี Ali code) -->
                  <router-link
                    v-else
                    :to="isDemo ? `/demo/watch/${v.index}` : `/my-cn/watch/${section._id}/${v.index}`"
                    class="video-row in-subtopic"
                    :class="{ watched: isWatched(v.index) }"
                  >
                    <div class="vr-check" :class="{ done: isWatched(v.index) }">
                      <svg v-if="isWatched(v.index)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
                      <span v-else>{{ v.index + 1 }}</span>
                    </div>
                    <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title">{{ v.title }}</span>
                      <div class="vr-meta">
                        <span class="vr-duration">{{ v.duration || '--:--' }}</span>
                        <span v-if="formatResume(v.index)" class="vr-resume">{{ formatResume(v.index) }}</span>
                      </div>
                    </div>
                    <button v-if="v.hasPdf && !isDemo" class="vr-pdf" :disabled="pdfLoading === v.index" @click.stop.prevent="showPdfModal(v.index)" title="เอกสาร">
                      <span v-if="pdfLoading === v.index" class="vr-pdf-spinner"></span>
                      <svg v-else viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg>
                    </button>
                    <div v-if="getProgressPct(v.index) > 0" class="vr-progress"><div class="vr-progress-fill" :style="{ width: getProgressPct(v.index) + '%' }"></div></div>
                  </router-link>
                  <!-- Bonus LOCK (sub) -->
                  <div v-if="v.hasBonusVideo && v.bonusLocked" class="video-row bonus-row in-subtopic locked-row">
                    <div class="vr-check bonus-star locked-check">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                    </div>
                    <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:#cbd5e1"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title locked-title">{{ v.bonusLabel || 'VDO เสริม' }}</span>
                      <div class="vr-meta"><span class="vr-tier-badge">ระดับ 6</span></div>
                    </div>
                  </div>
                  <!-- Bonus Video (มี VDO จริง — unlocked, sub) -->
                  <router-link v-else-if="v.hasBonusVideo" :to="isDemo ? `/demo/watch/${v.index}` : `/my-cn/watch/${section._id}/${v.index}?bonus=1`" class="video-row bonus-row in-subtopic">
                    <div class="vr-check bonus-star">&#11088;</div>
                    <svg class="vr-video-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title">{{ v.bonusTitle || 'VDO เสริม' }}</span>
                      <div class="vr-meta">
                        <span class="vr-duration">{{ v.bonusDuration || '--:--' }}</span>
                        <span class="vr-bonus-label">{{ v.bonusLabel || 'เสริม' }}</span>
                      </div>
                    </div>
                    <button v-if="v.bonusHasPdf && !isDemo" class="vr-pdf" @click.stop.prevent="showPdfModal(v.index, true)" title="เอกสาร">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg>
                    </button>
                    <div v-if="getBonusProgressPct(v.index) > 0" class="vr-progress"><div class="vr-progress-fill bonus" :style="{ width: getBonusProgressPct(v.index) + '%' }"></div></div>
                  </router-link>
                  <!-- Bonus เอกสารอย่างเดียว (ไม่มี VDO) -->
                  <div v-else-if="!v.hasBonusVideo && v.hasBonus && v.bonusHasPdf" class="video-row bonus-row doc-row in-subtopic" @click="showPdfModal(v.index, true)">
                    <div class="vr-check bonus-star">&#11088;</div>
                    <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:#f59e0b"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title">{{ v.bonusTitle || v.bonusLabel || 'เอกสารเสริม' }}</span>
                      <div class="vr-meta"><span class="vr-bonus-label">{{ v.bonusLabel || 'เสริม' }}</span> <span class="vr-doc-label">เอกสาร</span></div>
                    </div>
                  </div>
                  <!-- Bonus placeholder (ไม่มี VDO ไม่มี PDF) -->
                  <div v-else-if="!v.hasBonusVideo && v.hasBonus" class="video-row bonus-row placeholder-row in-subtopic">
                    <div class="vr-check bonus-star">&#11088;</div>
                    <svg class="vr-video-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:var(--gray-2)"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                    <div class="vr-info">
                      <span class="vr-title" style="color:var(--gray)">{{ v.bonusTitle || v.bonusLabel || 'เสริม' }}</span>
                      <div class="vr-meta"><span class="vr-placeholder-label">เตรียมเนื้อหา</span></div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

        </template>
      </div>
    </div>

    <!-- PDF Consent Modal -->
    <Teleport to="body">
      <div v-if="pdfModalIdx !== null" class="pdf-modal-overlay" @click.self="!pdfLoadingMsg && (pdfModalIdx = null)">
        <div class="pdf-modal">
          <h3 class="pdf-modal-title">ข้อตกลงการดาวน์โหลดเอกสาร</h3>
          <div class="pdf-modal-body">
            <p class="pdf-modal-user">เอกสารฉบับนี้จัดทำขึ้นเฉพาะสำหรับ<br><strong>{{ userName }}</strong></p>
            <p class="pdf-modal-note">เอกสารนี้ถูกฝังระบบป้องกันขั้นสูงเพื่อระบุตัวตนผู้ดาวน์โหลด ทั้งแบบที่มองเห็นและมองไม่เห็น</p>
            <p class="pdf-modal-subtitle">สิทธิ์การใช้งาน:</p>
            <p class="pdf-modal-note">เอกสารนี้จัดทำขึ้นเพื่อประกอบการศึกษาของคุณโดยเฉพาะ</p>
            <div class="pdf-modal-warning">
              <strong>กรุณาใช้เอกสารเพื่อการศึกษาส่วนตัวเท่านั้น:</strong>
              <ul style="margin:6px 0 0 0;padding-left:18px">
                <li>ไม่ถ่ายเอกสาร สแกน หรือ screenshot เพื่อส่งต่อ</li>
                <li>ไม่โพสต์ลง Facebook, LINE, หรือกลุ่มใดๆ</li>
                <li>ไม่ส่งต่อให้ผู้อื่น</li>
              </ul>
            </div>
            <div class="pdf-modal-legal">
              เอกสารนี้ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537 ซึ่งมีทั้งโทษทางแพ่งและอาญา<br>
              <strong>บริษัท เมดนินจา จำกัด</strong> สงวนสิทธิ์ในการดำเนินการตามกฎหมายหากพบการเผยแพร่โดยไม่ได้รับอนุญาต
            </div>
          </div>
          <!-- Loading state -->
          <div v-if="pdfLoadingMsg" class="pdf-modal-loading">
            <div class="pdf-loading-spinner"></div>
            <p>{{ pdfLoadingMsg }}</p>
            <div class="pdf-loading-bar"><div class="pdf-loading-fill" :class="{ 'real-progress': pdfProgress !== null }" :style="pdfProgress !== null ? { width: pdfProgress + '%' } : {}"></div></div>
            <p class="pdf-loading-hint">กรุณาอย่าปิดหน้านี้ระหว่างดาวน์โหลด</p>
          </div>
          <div class="pdf-modal-actions" v-if="!pdfLoadingMsg">
            <button class="pdf-modal-cancel" @click="pdfModalIdx = null">ยกเลิก</button>
            <button class="pdf-modal-accept" @click="acceptAndDownload">
              ยอมรับเงื่อนไขและดาวน์โหลด
            </button>
          </div>
        </div>
      </div>
      <!-- Group PDF consent modal (เหมือน video consent เป๊ะ) -->
      <div v-if="groupPdfModal" class="pdf-modal-overlay" @click.self="!pdfLoadingMsg && (groupPdfModal = null)">
        <div class="pdf-modal">
          <h3 class="pdf-modal-title">ข้อตกลงการดาวน์โหลดเอกสาร</h3>
          <div class="pdf-modal-body">
            <p class="pdf-modal-user">เอกสารฉบับนี้จัดทำขึ้นเฉพาะสำหรับ<br><strong>{{ userName }}</strong></p>
            <p class="pdf-modal-note">เอกสารนี้ถูกฝังระบบป้องกันขั้นสูงเพื่อระบุตัวตนผู้ดาวน์โหลด ทั้งแบบที่มองเห็นและมองไม่เห็น</p>
            <p class="pdf-modal-subtitle">สิทธิ์การใช้งาน:</p>
            <p class="pdf-modal-note">เอกสารนี้จัดทำขึ้นเพื่อประกอบการศึกษาของคุณโดยเฉพาะ</p>
            <div class="pdf-modal-warning">
              <strong>กรุณาใช้เอกสารเพื่อการศึกษาส่วนตัวเท่านั้น:</strong>
              <ul style="margin:6px 0 0 0;padding-left:18px">
                <li>ไม่ถ่ายเอกสาร สแกน หรือ screenshot เพื่อส่งต่อ</li>
                <li>ไม่โพสต์ลง Facebook, LINE, หรือกลุ่มใดๆ</li>
                <li>ไม่ส่งต่อให้ผู้อื่น</li>
              </ul>
            </div>
            <div class="pdf-modal-legal">
              เอกสารนี้ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537 ซึ่งมีทั้งโทษทางแพ่งและอาญา<br>
              <strong>บริษัท เมดนินจา จำกัด</strong> สงวนสิทธิ์ในการดำเนินการตามกฎหมายหากพบการเผยแพร่โดยไม่ได้รับอนุญาต
            </div>
          </div>
          <div v-if="pdfLoadingMsg" class="pdf-modal-loading">
            <div class="pdf-loading-spinner"></div>
            <p>{{ pdfLoadingMsg }}</p>
            <div class="pdf-loading-bar"><div class="pdf-loading-fill" :class="{ 'real-progress': pdfProgress !== null }" :style="pdfProgress !== null ? { width: pdfProgress + '%' } : {}"></div></div>
            <p class="pdf-loading-hint">กรุณาอย่าปิดหน้านี้ระหว่างดาวน์โหลด</p>
          </div>
          <div class="pdf-modal-actions" v-if="!pdfLoadingMsg">
            <button class="pdf-modal-cancel" @click="groupPdfModal = null">ยกเลิก</button>
            <button class="pdf-modal-accept" @click="acceptAndDownloadGroup">ยอมรับเงื่อนไขและดาวน์โหลด</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Self Check Modal -->
    <SelfCheckModal
      v-if="selfCheckSlug"
      :slug="selfCheckSlug"
      @close="selfCheckSlug = null"
      @progress="onSelfCheckProgress"
    />
  </div>
</template>

<script>
import { useActivationStore } from '../stores/activation'
import { useCountryGuard } from '../composables/useCountryGuard'
import api from '../services/api'
import SelfCheckModal from '../components/SelfCheckModal.vue'

export default {
  name: 'SectionCnPage',
  components: { SelfCheckModal },
  data() {
    return {
      progressMap: {},
      pdfLoading: null,
      pdfModalIdx: null,
      pdfLoadingMsg: '',
      pdfProgress: null,
      groupPdfLoading: null,
      groupPdfModal: null,
      selfCheckSlug: null     // เปิด modal ของ Self Check (templateSlug)
    }
  },
  setup() {
    const activationStore = useActivationStore()
    // CN mirror guard — logout ถ้า IP เปลี่ยนไม่ใช่จีน
    useCountryGuard('CN')
    return { activationStore }
  },
  computed: {
    userName() {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || '-'
    },
    isDemo() {
      return this.$route.meta.demo === true
    },
    section() {
      return this.activationStore.currentSection
    },
    topicCount() {
      if (!this.section?.videos) return 0
      const topics = new Set(this.section.videos.map(v => v.topic).filter(Boolean))
      return topics.size
    },
    overallProgress() {
      if (!this.section?.videos?.length) return { watched: 0, total: 0, pct: 0, totalDuration: 0 }
      let total = 0
      let watched = 0
      let totalDuration = 0
      for (let i = 0; i < this.section.videos.length; i++) {
        const v = this.section.videos[i]
        total++
        if (this.isWatched(v.index ?? i)) watched++
        totalDuration += this.parseDurationToSeconds(v.duration)
        // นับ bonus ด้วย
        if (v.hasBonusVideo) {
          total++
          if (this.isBonusWatched(v.index ?? i)) watched++
          totalDuration += this.parseDurationToSeconds(v.bonusDuration)
        }
      }
      return {
        watched,
        total,
        pct: total > 0 ? Math.round((watched / total) * 100) : 0,
        totalDuration
      }
    },
    hierarchicalTopics() {
      if (!this.section?.videos) return []
      const topics = []
      let currentTopic = null
      let currentSubtopic = null

      for (const v of this.section.videos) {
        if (!v.topic) {
          // Ungrouped video
          if (!currentTopic || currentTopic.name !== null) {
            currentTopic = { name: null, subtopics: [], videos: [], totalDuration: 0, watchedCount: 0, totalCount: 0 }
            topics.unshift(currentTopic)
            currentSubtopic = null
          }
          currentTopic.videos.push(v)
          currentTopic.totalCount++
          currentTopic.totalDuration += this.parseDurationToSeconds(v.duration)
          if (this.isWatched(v.index)) currentTopic.watchedCount++
          if (v.hasBonusVideo) {
            currentTopic.totalCount++
            currentTopic.totalDuration += this.parseDurationToSeconds(v.bonusDuration)
            if (this.isBonusWatched(v.index)) currentTopic.watchedCount++
          }
          continue
        }

        if (!currentTopic || currentTopic.name !== v.topic) {
          currentTopic = { name: v.topic, topicId: v.topicId || '', subtopics: [], videos: [], totalDuration: 0, watchedCount: 0, totalCount: 0 }
          topics.push(currentTopic)
          currentSubtopic = null
        }

        const secs = this.parseDurationToSeconds(v.duration)
        const bonusSecs = v.hasBonusVideo ? this.parseDurationToSeconds(v.bonusDuration) : 0
        currentTopic.totalCount++
        currentTopic.totalDuration += secs
        if (this.isWatched(v.index)) currentTopic.watchedCount++
        // นับ bonus ใน topic
        if (v.hasBonusVideo) {
          currentTopic.totalCount++
          currentTopic.totalDuration += bonusSecs
          if (this.isBonusWatched(v.index)) currentTopic.watchedCount++
        }

        if (v.subtopic) {
          if (!currentSubtopic || currentSubtopic.name !== v.subtopic) {
            currentSubtopic = { name: v.subtopic, subtopicId: v.subtopicId || '', videos: [], totalDuration: 0, watchedCount: 0, totalCount: 0 }
            currentTopic.subtopics.push(currentSubtopic)
          }
          currentSubtopic.videos.push(v)
          currentSubtopic.totalCount++
          currentSubtopic.totalDuration += secs
          if (this.isWatched(v.index)) currentSubtopic.watchedCount++
          // นับ bonus ใน subtopic
          if (v.hasBonusVideo) {
            currentSubtopic.totalCount++
            currentSubtopic.totalDuration += bonusSecs
            if (this.isBonusWatched(v.index)) currentSubtopic.watchedCount++
          }
        } else {
          currentTopic.videos.push(v)
        }
      }

      return topics
    }
  },
  created() {
    if (this.isDemo) {
      this.activationStore.fetchDemoSection()
    } else {
      const sectionId = this.$route.params.id
      this.activationStore.fetchSection(sectionId)
      this._fetchProgress(sectionId)
    }
  },
  mounted() {
    // refresh progress when user navigates back to page (e.g. from watch page) — gives ✓ ติดเลย
    this._visHandler = () => {
      if (!document.hidden && !this.isDemo) {
        this._fetchProgress(this.$route.params.id)
      }
    }
    document.addEventListener('visibilitychange', this._visHandler)
    window.addEventListener('focus', this._visHandler)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this._visHandler)
    window.removeEventListener('focus', this._visHandler)
  },
  watch: {
    '$route.params.id'(newId) {
      if (newId && !this.isDemo) this._fetchProgress(newId)
    }
  },
  methods: {
    // ⭐ CN mirror: video พร้อมใช้เมื่อ Ali pair ครบทั้งคู่ (NoDRM + DRM)
    // ถ้าใส่แค่ตัวเดียว = ยังอัพโหลดไม่ครบ → นักเรียนเห็น "รออัพโหลด"
    hasCnVideo(v) {
      if (!v) return false
      return !!(v.aliVideoId && v.aliDrmVideoId)
    },
    hasCnBonusVideo(v) {
      if (!v) return false
      return !!(v.bonusAliVideoId && v.bonusAliDrmVideoId)
    },
    // ─── Self Check ───
    topicSelfCheck(topic) {
      if (!this.section?.selfCheckMap || !topic?.topicId) return null
      return this.section.selfCheckMap[topic.topicId] || null
    },
    subtopicSelfCheck(sub) {
      if (!this.section?.selfCheckMap || !sub?.subtopicId) return null
      return this.section.selfCheckMap[sub.subtopicId] || null
    },
    openSelfCheck(slug) {
      this.selfCheckSlug = slug
    },
    onSelfCheckProgress({ percent, completed, total }) {
      // อัพเดต badge ทันทีโดยไม่ refetch ทั้ง section
      if (!this.section?.selfCheckMap || !this.selfCheckSlug) return
      for (const refId of Object.keys(this.section.selfCheckMap)) {
        const meta = this.section.selfCheckMap[refId]
        if (meta.templateSlug === this.selfCheckSlug) {
          meta.percent = percent
          meta.completed = completed
          meta.total = total
        }
      }
    },
    parseDurationToSeconds(dur) {
      if (!dur) return 0
      const parts = dur.split(':').map(Number)
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      return 0
    },
    isVideoRow(v) {
      // hasVideo มาจาก backend (!!bunnyVideoId)
      // fallback: ถ้า backend เก่ายังไม่ส่ง hasVideo → ดูจาก duration (มี duration = มีวิดีโอ)
      if (v.hasVideo !== undefined) return v.hasVideo
      return !!(v.duration && v.duration !== '--:--')
    },
    formatTotalDuration(seconds) {
      if (seconds <= 0) return ''
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      if (h > 0) return `${h} ชม. ${m} น.`
      return `${m} น.`
    },
    async _fetchProgress(sectionId) {
      try {
        const res = await api.get(`/my/watch-progress/${sectionId}`)
        const map = {}
        for (const p of (res.progress || [])) {
          const key = p.isBonus ? `bonus_${p.videoIndex}` : p.videoIndex
          map[key] = { currentTime: p.currentTime, watched: p.watched }
        }
        this.progressMap = map
      } catch { /* ignore */ }
    },
    isWatched(idx) {
      return this.progressMap[idx]?.watched === true
    },
    isBonusWatched(idx) {
      return this.progressMap[`bonus_${idx}`]?.watched === true
    },
    getProgressPct(idx) {
      const p = this.progressMap[idx]
      if (!p || !p.currentTime) return 0
      const vid = this.section?.videos?.find(v => v.index === idx)
      if (!vid?.duration) return 0
      const totalSec = this.parseDurationToSeconds(vid.duration)
      if (totalSec <= 0) return 0
      return Math.min(100, Math.round((p.currentTime / totalSec) * 100))
    },
    getBonusProgressPct(idx) {
      const p = this.progressMap[`bonus_${idx}`]
      if (!p || !p.currentTime) return 0
      const vid = this.section?.videos?.find(v => v.index === idx)
      if (!vid?.bonusDuration) return 0
      const totalSec = this.parseDurationToSeconds(vid.bonusDuration)
      if (totalSec <= 0) return 0
      return Math.min(100, Math.round((p.currentTime / totalSec) * 100))
    },
    showPdfModal(videoIdx, isBonus = false) {
      this.pdfModalIdx = videoIdx
      this._pdfIsBonus = isBonus
    },
    acceptAndDownload() {
      const idx = this.pdfModalIdx
      this.pdfLoadingMsg = 'กำลังเตรียมเอกสาร...'
      this.downloadPdf(idx, this._pdfIsBonus)
    },
    async downloadPdf(videoIdx, isBonus = false) {
      if (this.pdfLoading !== null) return
      this.pdfLoading = videoIdx
      this.pdfLoadingMsg = 'กำลังเตรียมเอกสาร...'
      try {
        const token = localStorage.getItem('token')
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        const sectionId = this.$route.params.id
        const bonusQuery = isBonus ? '?bonus=1' : ''

        this.pdfLoadingMsg = 'กำลังเข้าคิว...'
        const startRes = await fetch(`/api/my/sections/${sectionId}/videos/${videoIdx}/pdf-start${bonusQuery}`, {
          method: 'POST', headers
        })
        if (!startRes.ok) {
          const err = await startRes.json().catch(() => ({}))
          this.pdfLoadingMsg = ''
          this.pdfModalIdx = null
          alert(err.message || 'เริ่มดาวน์โหลดไม่สำเร็จ')
          return
        }
        const { jobId } = await startRes.json()

        const result = await new Promise((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const sr = await fetch(`/api/my/pdf-job/${jobId}/status`, { headers: { 'Authorization': `Bearer ${token}` } })
              const sd = await sr.json()
              this.pdfLoadingMsg = `${sd.statusText || 'กำลังทำ...'} ${sd.percent || 0}%`
              this.pdfProgress = sd.percent || 0
              if (sd.status === 'done') { clearInterval(poll); resolve(jobId) }
              else if (sd.status === 'error') { clearInterval(poll); reject(new Error(sd.statusText || 'ผิดพลาด')) }
            } catch (e) { clearInterval(poll); reject(e) }
          }, 1500)
          setTimeout(() => { clearInterval(poll); reject(new Error('หมดเวลา กรุณาลองใหม่')) }, 600000)
        })

        this.pdfLoadingMsg = 'กำลังดาวน์โหลด...'
        const dlRes = await fetch(`/api/my/pdf-job/${result}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!dlRes.ok) { throw new Error('ดาวน์โหลดไม่สำเร็จ') }

        const blob = await dlRes.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const vid = this.section?.videos?.find(v => v.index === videoIdx)
        const rawTitle = isBonus ? (vid?.bonusTitle || vid?.title) : vid?.title
        const vidTitle = (rawTitle || 'document').replace(/\s+/g, '_')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const uName = `${user.firstName || ''}${user.lastName ? '_' + user.lastName : ''}`.replace(/\s+/g, '_') || 'student'
        a.download = `${uName}_${vidTitle}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        this.pdfModalIdx = null
      } catch {
        alert('ดาวน์โหลดไม่สำเร็จ')
        this.pdfModalIdx = null
      } finally {
        this.pdfLoading = null
        this.pdfLoadingMsg = ''
        this.pdfProgress = null
      }
    },
    showGroupPdfModal(type, name) {
      this.groupPdfModal = { type, name }
    },
    acceptAndDownloadGroup() {
      if (!this.groupPdfModal) return
      const { type, name } = this.groupPdfModal
      this.pdfLoadingMsg = 'กำลังเข้าคิว...'
      this.downloadGroupPdf(type, name)
    },
    async downloadGroupPdf(type, name) {
      if (this.groupPdfLoading) return
      this.groupPdfLoading = name
      try {
        const token = localStorage.getItem('token')
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        const sectionId = this.section._id
        const pdfType = type === 'topic' ? 'topic' : 'subtopic'

        this.pdfLoadingMsg = 'กำลังเข้าคิว...'
        const startRes = await fetch(`/api/my/sections/${sectionId}/group-pdf-start/${pdfType}/${encodeURIComponent(name)}`, {
          method: 'POST', headers
        })
        if (!startRes.ok) {
          const d = await startRes.json().catch(() => ({}))
          this.pdfLoadingMsg = ''
          this.groupPdfModal = null
          alert(d.message || 'เริ่มดาวน์โหลดไม่สำเร็จ')
          return
        }
        const { jobId } = await startRes.json()

        const result = await new Promise((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const sr = await fetch(`/api/my/pdf-job/${jobId}/status`, { headers: { 'Authorization': `Bearer ${token}` } })
              const sd = await sr.json()
              this.pdfLoadingMsg = `${sd.statusText || 'กำลังทำ...'} ${sd.percent || 0}%`
              this.pdfProgress = sd.percent || 0
              if (sd.status === 'done') { clearInterval(poll); resolve(jobId) }
              else if (sd.status === 'error') { clearInterval(poll); reject(new Error(sd.statusText || 'ผิดพลาด')) }
            } catch (e) { clearInterval(poll); reject(e) }
          }, 1500)
          setTimeout(() => { clearInterval(poll); reject(new Error('หมดเวลา กรุณาลองใหม่')) }, 600000)
        })

        this.pdfLoadingMsg = 'กำลังดาวน์โหลด...'
        const dlRes = await fetch(`/api/my/pdf-job/${result}/download`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (!dlRes.ok) throw new Error('ดาวน์โหลดไม่สำเร็จ')

        const blob = await dlRes.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        const uName = `${u.firstName || ''}_${u.lastName || ''}`.replace(/\s+/g, '_')
        a.download = `${uName}_${name.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
        this.groupPdfModal = null
      } catch (e) {
        alert('ดาวน์โหลดไม่สำเร็จ')
        this.groupPdfModal = null
      } finally {
        this.groupPdfLoading = null
        this.pdfLoadingMsg = ''
        this.pdfProgress = null
      }
    },
    formatResume(idx) {
      const t = this.progressMap[idx]?.currentTime || 0
      if (t < 10) return ''
      const m = Math.floor(t / 60)
      const s = Math.floor(t % 60)
      return `ดูถึง ${m}:${String(s).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.section-page {
  --book-navy:#003580; --book-blue:#0071c2; --book-yellow:#feba02;
  --book-green:#008009; --stroke:#0f172a;
  background: #f6f8fb;
  min-height: 100vh;
  overflow-wrap: anywhere;
}
.section-page * { min-width: 0; }

/* ═══ HEADER (เดิม layout: back + code + title + meta) ═══ */
.page-header {
  background: var(--book-navy);
  padding: 18px 0 22px;
  border-bottom: 1.5px solid var(--stroke);
  margin-bottom: 20px;
}
.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 800;
  color: var(--book-yellow);
  text-decoration: none;
  background: rgba(0,0,0,.25);
  padding: 7px 14px; border-radius: 6px;
  border: 1.5px solid var(--book-yellow);
  margin-bottom: 14px;
  transition: all .12s;
}
.back-link:hover { background: var(--book-yellow); color: #0f172a; }
.back-link svg { width: 14px; height: 14px; }

.header-info { display: flex; flex-direction: column; gap: 6px; }
.sec-code-badge {
  display: inline-block; align-self: flex-start;
  background: var(--book-yellow); color: #0f172a;
  font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
  padding: 4px 10px; border-radius: 4px;
  border: 1.5px solid var(--stroke);
  word-break: break-word; max-width: 100%;
}
.header-info h1 {
  font-size: 24px; font-weight: 800;
  color: #fff; letter-spacing: -0.4px; line-height: 1.2;
  word-break: break-word; margin: 0;
}
.header-info p {
  font-size: 13px; color: rgba(255,255,255,.75);
  margin: 4px 0 0;
}
.header-meta {
  display: flex; flex-wrap: wrap; gap: 6px 16px;
  margin-top: 10px;
  font-size: 12.5px; color: rgba(255,255,255,.85);
}
.header-meta span { display: inline-flex; align-items: center; gap: 5px; }

.sec-content { padding: 0 16px 80px; max-width: 880px; margin: 0 auto; }

/* ═══ Overall Progress (Booking + stroke) ═══ */
.overall-progress {
  margin-bottom: 18px; padding: 14px 18px;
  background: #fff;
  border: 1.5px solid var(--stroke);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--stroke);
}
.op-info { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.op-label { font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
.op-stats { font-size: 12.5px; color: #64748b; margin-left: auto; font-weight: 600; }
.op-bar {
  height: 10px; background: #f1f5f9;
  border-radius: 999px; overflow: hidden;
  border: 1.5px solid var(--stroke);
}
.op-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--book-blue), var(--book-yellow));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ═══ Video List ═══ */
.video-list { display: flex; flex-direction: column; gap: 14px; }

/* ═══ Topic Section ═══ */
.topic-section {
  background: #fff;
  border: 1.5px solid var(--stroke);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--stroke);
  overflow: hidden;
}

/* ═══ Topic Header ═══ */
.topic-header {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--book-navy), var(--book-blue));
  color: #fff;
  border-bottom: 1.5px solid var(--stroke);
}
.topic-icon {
  width: 32px; height: 32px; border-radius: 6px;
  background: var(--book-yellow); color: #0f172a;
  border: 1.5px solid var(--stroke);
  display: grid; place-items: center; flex-shrink: 0;
}
.topic-info { flex: 1; min-width: 0; }
.topic-name { font-size: 15px; font-weight: 800; color: #fff; display: block; line-height: 1.2; word-break: break-word; }
.topic-meta { font-size: 11.5px; color: rgba(255,255,255,.7); margin-top: 2px; font-weight: 500; }
.topic-progress-badge {
  font-size: 11px; font-weight: 800; color: #fff;
  background: rgba(0,0,0,.35);
  border: 1.5px solid rgba(255,255,255,.25);
  padding: 4px 10px; border-radius: 4px;
  white-space: nowrap; flex-shrink: 0;
}

/* ═══ Subtopic Header ═══ */
.subtopic-header {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px 10px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.subtopic-icon {
  width: 22px; height: 22px; border-radius: 4px;
  background: #e2e8f0; color: #334155;
  display: grid; place-items: center; flex-shrink: 0;
}
.subtopic-info { flex: 1; min-width: 0; }
.subtopic-name { font-size: 13px; font-weight: 800; color: #1e293b; display: block; line-height: 1.2; word-break: break-word; }
.subtopic-meta { font-size: 11px; color: #64748b; margin-top: 1px; font-weight: 500; }
.subtopic-progress-badge {
  font-size: 10.5px; font-weight: 800; color: #334155;
  background: #e2e8f0;
  padding: 3px 8px; border-radius: 4px;
  white-space: nowrap; flex-shrink: 0;
}

/* ═══ Group PDF Button ═══ */
.group-pdf-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 4px;
  background: #fff; color: #0f172a;
  border: 1.5px solid var(--stroke);
  font-size: 11px; font-weight: 800; cursor: pointer;
  flex-shrink: 0; transition: all 0.12s;
  font-family: inherit;
  white-space: nowrap;
}
.group-pdf-btn:hover { background: var(--book-yellow); }
.group-pdf-btn:disabled { opacity: 0.6; cursor: wait; }
.group-pdf-btn.subtopic { background: #fff; color: #1e293b; }
.group-pdf-btn.subtopic:hover { background: var(--book-yellow); }

/* ═══ Self Check Button (topic + subtopic header) ═══ */
.self-check-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 999px;
  background: linear-gradient(135deg, var(--sc-color, #3b82f6), color-mix(in srgb, var(--sc-color, #3b82f6) 80%, #fff));
  color: #fff;
  border: 0;
  font-size: 11px; font-weight: 800; cursor: pointer;
  flex-shrink: 0; transition: all 0.15s;
  font-family: inherit; white-space: nowrap;
  box-shadow: 0 2px 6px rgba(59,130,246,.25), inset 0 1px 0 rgba(255,255,255,.2);
}
.self-check-btn:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 4px 10px rgba(59,130,246,.32), inset 0 1px 0 rgba(255,255,255,.25); }
.self-check-btn .sc-icon { font-size: 13px; line-height: 1; }
.self-check-btn .sc-label { font-weight: 700; opacity: .95; }
.self-check-btn .sc-percent {
  background: rgba(255,255,255,.22);
  padding: 1px 6px; border-radius: 999px;
  font-weight: 900; font-size: 10px; letter-spacing: 0.3px;
}
.self-check-btn.subtopic-sc { padding: 4px 9px; font-size: 10.5px; }
.self-check-btn.subtopic-sc .sc-icon { font-size: 12px; }
.self-check-btn.subtopic-sc .sc-percent { font-size: 9.5px; padding: 1px 5px; }

/* ═══ Video Row ═══ */
.video-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  text-decoration: none; color: inherit;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s; position: relative;
  min-width: 0;
}
.video-row:hover { background: #f8fafc; }
.video-row:last-child { border-bottom: none; }
.video-row.in-subtopic { padding-left: 32px; }

/* Checkbox indicator (circle + ✓ when done) */
.vr-check {
  width: 26px; height: 26px;
  background: #fff; color: #64748b;
  border: 1.5px solid var(--stroke);
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 12px; font-weight: 800;
  flex-shrink: 0;
  transition: all 0.15s;
}
.vr-check.done {
  background: var(--book-green); color: #fff;
  border-color: var(--book-green);
}
.vr-check.bonus-star {
  background: var(--book-yellow); color: #0f172a;
  border-color: var(--stroke); border-radius: 6px;
  font-size: 13px;
}

/* Video icon */
.vr-video-icon { width: 14px; height: 14px; color: #94a3b8; flex-shrink: 0; }

/* Info */
.vr-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.vr-title { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3; word-break: break-word; }
.vr-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.vr-duration {
  display: inline-flex; align-items: center; gap: 4px;
  background: #f1f5f9; color: #334155;
  padding: 2px 7px; border-radius: 4px;
  font-weight: 700; font-size: 11px;
}
.vr-resume {
  font-size: 11px; color: var(--book-blue); font-weight: 800;
}
.vr-bonus-label {
  font-size: 11px; font-weight: 700; color: #b45309;
  background: rgba(254,186,2,.18); padding: 2px 7px; border-radius: 4px;
}

/* Placeholder row */
.placeholder-row { opacity: 0.55; cursor: default; }
.placeholder-row:hover { background: #fff; }

/* Locked row — tier ไม่ถึง */
.locked-row {
  background: #f8fafc;
  cursor: not-allowed;
  user-select: none;
}
.locked-row:hover { background: #f1f5f9; }
.locked-check {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border: 1px solid #e2e8f0 !important;
}
.locked-title {
  color: #94a3b8 !important;
  font-weight: 500;
}
.vr-tier-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 9999px;
  font-size: 10px; font-weight: 700;
  background: #e0f2fe; color: #0369a1;
  border: 1px solid #bae6fd;
}
.placeholder-check { background: #f1f5f9; border-color: #cbd5e1; color: #94a3b8; }
.vr-placeholder-label {
  font-size: 11px; font-weight: 600; color: #64748b;
  background: #f1f5f9; padding: 2px 7px; border-radius: 4px;
}

/* Doc-only row */
.doc-row { cursor: pointer; background: rgba(0,113,194,.04); }
.doc-row:hover { background: rgba(0,113,194,.09); }
.doc-check {
  background: var(--book-blue); border-color: var(--book-blue);
  color: #fff; border-radius: 6px;
}
.vr-doc-label {
  font-size: 11px; font-weight: 700; color: var(--book-blue);
  background: rgba(0,113,194,.12); padding: 2px 7px; border-radius: 4px;
}
.vr-pdf-download {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 6px;
  background: var(--book-blue); color: #fff;
  border: 1.5px solid var(--stroke);
  box-shadow: 2px 2px 0 var(--stroke);
  font-size: 12px; font-weight: 800; cursor: pointer;
  font-family: inherit; flex-shrink: 0;
  transition: all 0.12s;
}
.vr-pdf-download:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--stroke); }
.vr-pdf-download:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--stroke); }
.vr-pdf-download:disabled { opacity: 0.6; cursor: wait; transform: none; }

/* PDF button (small) */
.vr-pdf {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 10px;
  border-radius: 4px;
  background: #fff; color: var(--book-blue);
  border: 1.5px solid var(--stroke);
  cursor: pointer; flex-shrink: 0; transition: all 0.12s;
  font-size: 11px; font-weight: 800; white-space: nowrap;
  font-family: inherit;
}
.vr-pdf:hover { background: var(--book-yellow); color: #0f172a; }
.vr-pdf:disabled { opacity: 0.6; cursor: wait; }
.vr-pdf-spinner {
  width: 12px; height: 12px; border: 2px solid #cbd5e1; border-top-color: var(--book-blue);
  border-radius: 50%; animation: pdfSpin 0.6s linear infinite;
}
@keyframes pdfSpin { to { transform: rotate(360deg); } }

/* Progress bar (line at bottom of row) */
.vr-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #f1f5f9; }
.vr-progress-fill { height: 100%; background: var(--book-blue); transition: width 0.3s; }
.vr-progress-fill.bonus { background: var(--book-yellow); }

/* Bonus row */
.bonus-row { background: rgba(254,186,2,.06); }
.bonus-row:hover { background: rgba(254,186,2,.12); }

.video-row.watched .vr-title { color: #64748b; }

/* ═══ PDF Consent Modal ═══ */
.pdf-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center; justify-content: center; z-index: 99999; padding: 16px;
}
.pdf-modal {
  background: #fff; border-radius: 8px; max-width: 440px; width: 100%;
  border: 1.5px solid var(--stroke);
  box-shadow: 4px 4px 0 var(--stroke);
  overflow: hidden;
}
.pdf-modal-title {
  background: var(--book-navy); color: #fff;
  padding: 16px 22px; margin: 0;
  font-size: 16px; font-weight: 800;
  border-bottom: 1.5px solid var(--stroke);
}
.pdf-modal-body { padding: 20px 24px; }
.pdf-modal-user { font-size: 14px; color: #334155; margin-bottom: 16px; }
.pdf-modal-note { font-size: 13px; color: #475569; margin-bottom: 8px; }
.pdf-modal-subtitle { font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px; }
.pdf-modal-warning {
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
  padding: 12px 16px; font-size: 12px; color: #991b1b; line-height: 1.5;
}
.pdf-modal-legal {
  margin-top: 12px; font-size: 11px; color: #64748b; line-height: 1.5;
}
.pdf-modal-actions {
  display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid #e2e8f0;
  justify-content: flex-end;
}
.pdf-modal-cancel {
  padding: 10px 18px; border: 1.5px solid var(--stroke); border-radius: 6px;
  background: #fff; color: #0f172a; font-size: 13px; font-weight: 800; cursor: pointer;
  box-shadow: 2px 2px 0 var(--stroke);
  font-family: inherit; transition: all 0.12s;
}
.pdf-modal-cancel:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--stroke); }
.pdf-modal-cancel:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--stroke); }
.pdf-modal-accept {
  padding: 10px 22px; border: 1.5px solid var(--stroke); border-radius: 6px;
  background: var(--book-yellow); color: #0f172a; font-size: 13px; font-weight: 800; cursor: pointer;
  box-shadow: 2px 2px 0 var(--stroke);
  font-family: inherit; transition: all 0.12s;
}
.pdf-modal-accept:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--stroke); }
.pdf-modal-accept:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--stroke); }
.pdf-modal-accept:disabled { opacity: 0.5; cursor: wait; transform: none; }
.pdf-modal-loading { text-align: center; padding: 24px; }
.pdf-loading-spinner {
  width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0f172a;
  border-radius: 50%; animation: pdfSpin 0.7s linear infinite; margin: 0 auto 12px;
}
.pdf-modal-loading p { font-size: 14px; font-weight: 600; color: #334155; margin: 0 0 12px; }
.pdf-loading-bar { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
.pdf-loading-fill {
  height: 100%; background: linear-gradient(90deg, #3b82f6, #0f172a, #3b82f6);
  background-size: 200% 100%; animation: pdfProgress 1.5s ease infinite; width: 100%;
}
.pdf-loading-fill.real-progress {
  animation: none; background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  background-size: 100% 100%; transition: width 0.3s ease;
}
.pdf-loading-hint { font-size: 12px; color: #94a3b8; margin: 8px 0 0; }
@keyframes pdfProgress { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ═══ Responsive ═══ */
@media (max-width: 700px) {
  .page-header { padding: 14px 0 18px; margin-bottom: 16px; }
  .header-info h1 { font-size: 19px; }
  .header-info p { font-size: 12px; }
  .header-meta { font-size: 12px; gap: 4px 12px; }
  .back-link { font-size: 12.5px; padding: 6px 12px; margin-bottom: 10px; }
  .sec-content { padding: 0 12px 80px; }
  .overall-progress { padding: 12px 14px; }
  .op-info { gap: 4px; }
  .op-stats { margin-left: 0; font-size: 12px; }
  .video-list { gap: 12px; }

  /* topic */
  .topic-header { padding: 10px 12px; gap: 10px; flex-wrap: wrap; }
  .topic-icon { width: 28px; height: 28px; }
  .topic-name { font-size: 14px; }
  .topic-meta { font-size: 11px; }
  .topic-progress-badge, .group-pdf-btn { font-size: 10.5px; padding: 3px 8px; }

  /* subtopic */
  .subtopic-header { padding: 9px 12px 9px 24px; gap: 8px; }
  .subtopic-name { font-size: 12.5px; }

  /* video row */
  .video-row { padding: 11px 12px; gap: 10px; }
  .video-row.in-subtopic { padding-left: 24px; }
  .vr-check { width: 24px; height: 24px; font-size: 11px; }
  .vr-title { font-size: 13px; }
  .vr-meta { font-size: 11px; }
  .vr-duration { font-size: 10.5px; }
  .vr-pdf { padding: 5px 8px; font-size: 10.5px; }
  .vr-pdf-download { padding: 6px 10px; font-size: 11.5px; }
}

@media (max-width: 380px) {
  .video-row { gap: 8px; padding: 10px; }
  .video-row.in-subtopic { padding-left: 18px; }
  .vr-video-icon { display: none; }
  .vr-pdf, .vr-pdf-download {
    padding: 5px 7px; gap: 0;
  }
  .vr-pdf svg + span, .vr-pdf-download svg + span { display: none; }
}

/* ⭐ CN mirror: video ที่ยังไม่มี Ali code — เทา รออัพโหลด */
.video-row.cn-pending {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(0.6);
  background: #f8fafc;
}
.video-row.cn-pending:hover {
  background: #f8fafc;
  transform: none;
  box-shadow: none;
}
.cn-pending-title {
  color: #64748b !important;
  font-weight: 500;
}
.cn-pending-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
</style>
