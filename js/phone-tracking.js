// phone-tracking.js - Dynamic Phone Number Insertion v2
(function() {
  'use strict';

  // Маппинг источников на телефонные номера
  const phoneMapping = {
    // Платная реклама
    'google-cpc': '+14695011201',        // Google Ads Main
    'bing-cpc': '+14692050052',          // Bing Ads Main
    'facebook-cpc': '+14697514146',      // Facebook Ads
    'facebook-paid': '+14697514146',     // Facebook Ads (альт)
    
    // Органический поиск
    'google-organic': '+14692240577',    // GMB Organic
    
    // Директории и отзовики
    'yelp': '+14697300301',              // Yelp Reviews
    'homedepot': '+14694982044',         // ProHomeDepot
    
    // Default (прямые заходы, email, визитки)
    'default': '+14696460770'            // Off Business Card
  };

  // Получение UTM-параметров
  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || '',
      medium: urlParams.get('utm_medium') || '',
      campaign: urlParams.get('utm_campaign') || ''
    };
  }

  // Определение номера телефона
  function getPhoneNumber() {
    const utm = getUTMParams();
    const referrer = document.referrer.toLowerCase();
    
    // Проверка UTM-меток
    const key = `${utm.source}-${utm.medium}`.toLowerCase();
    
    if (phoneMapping[key]) {
      return phoneMapping[key];
    }
    
    // Проверка только source
    if (utm.source && phoneMapping[utm.source]) {
      return phoneMapping[utm.source];
    }
    
    // Проверка referrer для органики
    if (referrer.includes('google.com') && !utm.medium) {
      return phoneMapping['google-organic'];
    }
    
    if (referrer.includes('yelp.com')) {
      return phoneMapping['yelp'];
    }
    
    // Default номер для прямых заходов
    return phoneMapping['default'];
  }

  // Сохранение в sessionStorage
  function savePhoneToSession(phone) {
    try {
      sessionStorage.setItem('tracking_phone', phone);
      sessionStorage.setItem('tracking_phone_timestamp', Date.now());
    } catch (e) {
      console.warn('SessionStorage unavailable:', e);
    }
  }

  // Получение из sessionStorage
  function getPhoneFromSession() {
    try {
      const phone = sessionStorage.getItem('tracking_phone');
      const timestamp = sessionStorage.getItem('tracking_phone_timestamp');
      
      if (phone && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 30 * 60 * 1000) { // 30 минут
          return phone;
        }
      }
    } catch (e) {
      console.warn('SessionStorage unavailable:', e);
    }
    return null;
  }

  // Форматирование номера
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

  // Подмена номеров на странице
  function replacePhoneNumbers() {
    let phone = getPhoneFromSession() || getPhoneNumber();
    savePhoneToSession(phone);
    
    const formattedPhone = formatPhone(phone);
    
    // Tel: ссылки
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.href = `tel:${phone}`;
      if (link.textContent.match(/[\d\(\)\-\s]+/)) {
        link.textContent = formattedPhone;
      }
    });
    
    // Элементы с классами
    document.querySelectorAll('.phone-number, [data-phone]').forEach(element => {
      if (element.tagName === 'A') {
        element.href = `tel:${phone}`;
      }
      element.textContent = formattedPhone;
    });
    
    // Событие в dataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        'event': 'phone_number_set',
        'phoneNumber': phone,
        'phoneSource': getUTMParams().source || 'direct'
      });
    }
    
    console.log('Phone tracking:', phone, '| Source:', getUTMParams().source || 'direct');
  }

  // Инициализация
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replacePhoneNumbers);
  } else {
    replacePhoneNumbers();
  }
})();
