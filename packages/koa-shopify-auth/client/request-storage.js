(function() {
  function grantedStorageAccess() {
    alert('accepted');
  }

  function rejectedStorageAccess() {
  }

  function requestStorageAccess() {
    return document
      .requestStorageAccess()
      .then(grantedStorageAccess, rejectedStorageAccess);
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('AcceptCookies')
      .addEventListener('click', requestStorageAccess);
  });
})();
