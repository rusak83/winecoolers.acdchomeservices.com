// phone-tracking.js - Dynamic Phone Number Insertion
(function() {
  'use strict';
  const phoneMapping = {
    'google-cpc': '+14695011201',
    'bing-cpc': '+14692050052',
    'facebook-cpc': '+14697514146',
    'facebook-paid': '+14697514146',
    'google-organic': '+14692240577',
    'google': '+14692240577',
    'organic': '+14692240577',
    'yelp': '+14697300301',
    'yelp-cpc': '+14697300301',
    'homedepot': '+14694982044',
    'directories': '+14694982044',
    'default': '+14697300309'
  };
  function getBrandName() {
    const hostname = window.location.hostname;
    if (hostname.includes('subzero')) return 'Sub-Zero';
    else if (hostname.includes('viking')) return 'Viking';
    else if (hostname.includes('thermador')) return 'Thermador';
    else if (hostname.includes('icemachines')) return 'Ice Machines';
    return 'AC/DC';
  }
  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || '',
      medium: urlParams.get('utm_medium') || '',
      campaign: urlParams.get('utm_campaign') || ''
    };
  }
  function getPhoneNumber() {
    const utm = getUTMParams();
    const referrer = document.referrer.toLowerCase();
    const key = `${utm.source}-${utm.medium}`.toLowerCase();
    if (phoneMapping[key]) return phoneMapping[key];
    if (utm.source && phoneMapping[utm.source]) return phoneMapping[utm.source];
    if (referrer.includes('google.com') && !utm.medium) return phoneMapping['google-organic'];
    if (referrer.includes('yelp.com')) return phoneMapping['yelp'];
    return phoneMapping['default'];
  }
  function savePhoneToSession(phone) {
    try {
      sessionStorage.setItem('tracking_phone', phone);
      sessionStorage.setItem('tracking_phone_timestamp', Date.now());
    } catch (e) {
      console.warn('SessionStorage unavailable:', e);
    }
  }
  function getPhoneFromSession() {
    try {
      const phone = sessionStorage.getItem('tracking_phone');
      const timestamp = sessionStorage.getItem('tracking_phone_timestamp');
      if (phone && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 30 * 60 * 1000) return phone;
      }
    } catch (e) {
      console.warn('SessionStorage unavailable:', e);
    }
    return null;
  }
  function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned[0] === '1') {
      const areaCode = cleaned.substr(1, 3);
      const prefix = cleaned.substr(4, 3);
      const lineNumber = cleaned.substr(7, 4);
      return `(${areaCode}) ${prefix}-${lineNumber}`;
    }
    return phone;
  }
  function getChannelName() {
    const utm = getUTMParams();
    const key = `${utm.source}-${utm.medium}`.toLowerCase();
    if (key === 'google-cpc') return 'Google Ads';
    if (key === 'bing-cpc') return 'Bing Ads';
    if (key === 'facebook-cpc' || key === 'facebook-paid') return 'Facebook Ads';
    if (utm.source === 'google' && !utm.medium) return 'Google Organic';
    if (utm.source === 'yelp') return 'Yelp';
    if (utm.source === 'homedepot') return 'Home Depot';
    return 'Direct/Other';
  }
  function replacePhoneNumbers() {
    let phone = getPhoneFromSession() || getPhoneNumber();
    savePhoneToSession(phone);
    const formattedPhone = formatPhone(phone);
    const utm = getUTMParams();
    const brandName = getBrandName();
    const channelName = getChannelName();
    // Microsoft Ads call click tracking
    if (window.uetq) {
      window.uetq = window.uetq || [];
      window.uetq.push({
        _c: 97209961,
        ea: 'call_click',
        el: formattedPhone,
        ev: utm.source || 'direct'
      });
    }

    // GCLID for call click tracking
    if (window.dataLayer) {
      const gclid = new URLSearchParams(window.location.search).get('gclid');
      window.dataLayer.push({
        'event': 'call_click',
        'phone': phone,
        'gclid': gclid || 'none'
      });
    }

    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.href = `tel:${phone}`;
      if (link.textContent.match(/[\d\(\)\-\s]+/)) {
        link.textContent = formattedPhone;
      }
    });
    document.querySelectorAll('.phone-number, [data-phone], .cat-button').forEach(element => {
      if (element.tagName === 'A') {
        element.href = `tel:${phone}`;
      }
      element.textContent = formattedPhone;
    });
    if (window.dataLayer) {
      window.dataLayer.push({
        'event': 'phone_number_set',
        'phoneNumber': phone,
        'phoneFormatted': formattedPhone,
        'brandName': brandName,
        'channelName': channelName,
        'utm_source': utm.source || 'direct',
        'utm_medium': utm.medium || 'direct',
        'utm_campaign': utm.campaign || 'direct',
        'referrer': document.referrer
      });
    }
    console.log('✅ Phone Tracking Active:', {
      phone: phone,
      formatted: formattedPhone,
      brand: brandName,
      channel: channelName,
      source: utm.source || 'direct',
      medium: utm.medium || 'direct',
      campaign: utm.campaign || 'direct'
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replacePhoneNumbers);
  } else {
    replacePhoneNumbers();
  }
})();