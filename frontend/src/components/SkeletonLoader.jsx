import React from 'react';
import s from './SkeletonLoader.module.css';

/**
 * A skeleton loading screen that mirrors the LandingPage structure.
 * Shows pulsing placeholder bones for header, hero, arsenal, and pricing.
 */
export default function SkeletonLoader() {
  const bone = `${s.bone}`;

  return (
    <div className={s.skeletonPage}>
      {/* Header */}
      <div className={s.skelHeader}>
        <div className={s.skelLogo}>
          <div className={`${bone} ${s.skelLogoIcon}`} />
          <div className={`${bone} ${s.skelLogoText}`} />
        </div>
        <div className={s.skelNavLinks}>
          <div className={`${bone} ${s.skelNavLink}`} />
          <div className={`${bone} ${s.skelNavLink}`} />
          <div className={`${bone} ${s.skelNavLink}`} />
        </div>
        <div className={`${bone} ${s.skelLoginBtn}`} />
      </div>

      {/* Hero */}
      <div className={s.skelHero}>
        <div className={s.skelHeroContent}>
          <div className={`${bone} ${s.skelHeading}`} />
          <div className={`${bone} ${s.skelHeadingSm}`} />
          <div style={{ height: '1rem' }} />
          <div className={`${bone} ${s.skelParagraph}`} />
          <div className={`${bone} ${s.skelParagraph}`} />
          <div className={`${bone} ${s.skelParagraphSm}`} />
          <div style={{ height: '1rem' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.skelContactRow}>
              <div className={`${bone} ${s.skelContactIcon}`} />
              <div className={`${bone} ${s.skelContactText}`} />
            </div>
          ))}
        </div>
        <div className={`${bone} ${s.skelHeroImage}`} />
      </div>

      {/* Arsenal */}
      <div className={`${bone} ${s.skelSectionHeading}`} />
      <div className={s.skelArsenalGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${bone} ${s.skelArsenalCard}`} />
        ))}
      </div>

      {/* Pricing */}
      <div className={`${bone} ${s.skelSectionHeading}`} />
      <div className={s.skelPricingGrid}>
        <div className={`${bone} ${s.skelPricingCard}`} />
        <div className={`${bone} ${s.skelPricingCard}`} />
      </div>
    </div>
  );
}
