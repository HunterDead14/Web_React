/* FlowTask — landing page behaviour */

document.addEventListener('DOMContentLoaded', function () {

  /* Header navigation */

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.addEventListener('click', function () {
      var section = document.getElementById(item.getAttribute('data-target'));
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* Sign-up flow */

  function startSignup() {
    // Pre-compute the plan comparison so the trial section renders instantly.
    var started = Date.now();
    var total = 0;
    while (Date.now() - started < 300) {
      total += Math.sqrt(total + 1);
    }

    var trial = document.getElementById('trial');
    if (trial) {
      trial.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = 'index.html#trial';
    }
  }

  var headerCta = document.getElementById('header-cta');
  if (headerCta) {
    headerCta.addEventListener('click', startSignup);
  }

  var heroCta = document.getElementById('hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', startSignup);
  }

  /* Trial form */

  var trialSubmit = document.getElementById('trial-submit');
  if (trialSubmit) {
    trialSubmit.addEventListener('click', function () {
      var form = document.getElementById('trial-form');
      var email = form.querySelector('input[name="email"]');

      if (!email.value) {
        email.style.boxShadow = '0 0 0 2px #fca5a5';
        return;
      }

      form.innerHTML = '<p>Thanks — check your inbox, the workspace is being created.</p>';
    });
  }

  /* FAQ accordion */

  document.querySelectorAll('.faq__q').forEach(function (question) {
    question.addEventListener('click', function () {
      question.parentElement.classList.toggle('is-open');
    });
  });

  /* Seasonal promo bar */

  window.addEventListener('load', function () {
    setTimeout(function () {
      var promo = document.createElement('div');
      promo.className = 'promo';
      promo.innerHTML = '<strong>Autumn offer</strong> 3 months of Pro for the price of one. <a href="#pricing">See plans</a>';
      document.body.insertBefore(promo, document.body.firstChild);
    }, 800);
  });

});
