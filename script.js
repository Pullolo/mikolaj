/* Lightbox for the four enclosed plates. */
(function () {
  "use strict";

  var box = document.getElementById("lightbox");
  if (!box) return;

  var bigImg = box.querySelector(".lightbox__img");
  var bigCap = box.querySelector(".lightbox__cap");
  var closeBtn = box.querySelector(".lightbox__close");
  var lastFocus = null;

  /* Catch images that already failed before the inline handler ran. */
  Array.prototype.forEach.call(
    document.querySelectorAll(".plate img"),
    function (img) {
      if (img.complete && img.naturalWidth === 0) {
        img.closest(".plate").classList.add("is-missing");
      }
    }
  );

  function open(img) {
    var plate = img.closest(".plate");
    if (!plate || plate.classList.contains("is-missing")) return;
    if (!img.naturalWidth) return;

    lastFocus = document.activeElement;
    bigImg.src = img.currentSrc || img.src;
    bigImg.alt = img.alt || "";
    var cap = plate.querySelector("figcaption");
    var n = Array.prototype.indexOf.call(
      document.querySelectorAll(".plate"), plate
    ) + 1;
    bigCap.textContent =
      "Plate " + n + ". " + (cap ? cap.textContent.replace(/\s+/g, " ").trim() : "");
    box.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    bigImg.src = "";
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest(".plate img");
    if (img) {
      open(img);
      return;
    }
    if (e.target === box || e.target.closest(".lightbox__close")) close();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      e.preventDefault();
      closeBtn.focus();
    }
  });
})();
