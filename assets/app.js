(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initAuthGuard();
    initAuthPage();
    initNav();
    initUploadPage();
    initPreviewPage();
    initDownloadPage();
  });

  function isAuthPage() {
    return document.body.classList.contains("auth-page");
  }

  /* ================== AUTH ================== */
  function getUsers() {
    try {
      var raw = localStorage.getItem("users");
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed) return parsed;
      return {};
    } catch (err) {
      console.warn("Failed to parse users", err);
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  function initAuthGuard() {
    if (isAuthPage()) return;
    var current = localStorage.getItem("currentUser");
    if (!current) {
      window.location.href = "index.html";
    }
  }

  function initAuthPage() {
    if (!isAuthPage()) return;

    var tabButtons = document.querySelectorAll(".tab-button");
    var loginForm = document.getElementById("login-form");
    var registerForm = document.getElementById("register-form");
    var authMessage = document.getElementById("auth-message");

    if (tabButtons.length) {
      tabButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          tabButtons.forEach(function (b) {
            b.classList.remove("active");
          });
          btn.classList.add("active");
          var tab = btn.dataset.tab;
          if (tab === "login") {
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
          } else {
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
          }
          if (authMessage) {
            authMessage.textContent = "";
            authMessage.className = "hint-text";
          }
        });
      });
    }

    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var username = (document.getElementById("login-username").value || "").trim();
        var password = document.getElementById("login-password").value || "";

        var users = getUsers();
        var user = users[username];
        if (!user) {
          setAuthMessage("ไม่พบผู้ใช้นี้ กรุณาสมัครสมาชิกก่อน", true);
          return;
        }
        if (user.password !== password) {
          setAuthMessage("รหัสผ่านไม่ถูกต้อง", true);
          return;
        }

        localStorage.setItem("currentUser", username);
        setAuthMessage("ล็อกอินสำเร็จ กำลังไปหน้าโฮม…", false);
        setTimeout(function () {
          window.location.href = "home.html";
        }, 400);
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var username = (document.getElementById("register-username").value || "").trim();
        var password = document.getElementById("register-password").value || "";
        var password2 = document.getElementById("register-password2").value || "";

        if (username.length < 3) {
          setAuthMessage("กรุณากรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร", true);
          return;
        }
        if (password.length < 4) {
          setAuthMessage("กรุณากรอกรหัสผ่านอย่างน้อย 4 ตัวอักษร", true);
          return;
        }
        if (password !== password2) {
          setAuthMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน", true);
          return;
        }

        var users = getUsers();
        if (users[username]) {
          setAuthMessage("มีผู้ใช้นี้อยู่แล้ว กรุณาใช้ชื่ออื่น", true);
          return;
        }

        users[username] = { password: password };
        saveUsers(users);
        setAuthMessage("สมัครสมาชิกสำเร็จแล้ว สามารถเข้าสู่ระบบได้เลย", false);

        // สลับไปแท็บล็อกอิน
        tabButtons.forEach(function (b) {
          if (b.dataset.tab === "login") {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
      });
    }

    function setAuthMessage(msg, isError) {
      if (!authMessage) return;
      authMessage.textContent = msg;
      authMessage.className = "hint-text" + (isError ? " error" : " ok");
    }
  }

  /* ================== NAV ================== */
  function initNav() {
    var logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  /* ================== UPLOAD PAGE ================== */
  function initUploadPage() {
    var fileInput = document.getElementById("file-input");
    var uploadPreview = document.getElementById("upload-preview");
    var uploadPlaceholder = document.getElementById("upload-placeholder");
    var goPreviewBtn = document.getElementById("go-preview-btn");
    var uploadMessage = document.getElementById("upload-message");
    var autoRemoveBtn = document.getElementById("auto-remove-bg-btn");

    if (!fileInput || !goPreviewBtn) return;

    var currentFile = null;

    // ถ้ามีรูปใน localStorage แล้ว ให้แสดงเลย
    var stored = localStorage.getItem("rawPhoto");
    if (stored && uploadPreview && uploadPlaceholder) {
      uploadPreview.src = stored;
      uploadPreview.style.display = "block";
      uploadPlaceholder.style.display = "none";
    }

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf("image/") !== 0) {
        alert("กรุณาเลือกรูปภาพเท่านั้น");
        fileInput.value = "";
        if (uploadMessage) {
          uploadMessage.textContent = "ไฟล์ที่เลือกไม่ใช่รูปภาพ";
          uploadMessage.className = "hint-text error";
        }
        return;
      }

      currentFile = file;

      var reader = new FileReader();
      if (uploadMessage) {
        uploadMessage.textContent = "กำลังโหลดรูป…";
        uploadMessage.className = "hint-text";
      }
      reader.onload = function (ev) {
        var dataUrl = ev.target.result;
        localStorage.setItem("rawPhoto", dataUrl);
        if (uploadPreview && uploadPlaceholder) {
          uploadPreview.src = dataUrl;
          uploadPreview.style.display = "block";
          uploadPlaceholder.style.display = "none";
        }
        if (uploadMessage) {
          uploadMessage.textContent = "โหลดรูปเรียบร้อยแล้ว สามารถไปหน้าตั้งค่ารูปได้เลย";
          uploadMessage.className = "hint-text ok";
        }
      };
      reader.readAsDataURL(file);
    });

    if (autoRemoveBtn) {
      autoRemoveBtn.addEventListener("click", function () {
        if (!currentFile) {
          alert("กรุณาอัปโหลดรูปก่อน");
          return;
        }

        autoRemoveBtn.disabled = true;
        autoRemoveBtn.textContent = "กำลังลบพื้นหลัง…";

        var formData = new FormData();
        formData.append("image", currentFile);

        fetch("https://profile-ready-backend.onrender.com/api/remove-bg", {
            method: "POST",
            body: formData,
        })

          .then(function (res) {
            if (!res.ok) throw new Error("remove-bg failed");
            return res.json();
          })
          .then(function (data) {
            var output = Array.isArray(data.output) ? data.output[0] : data.output;
            if (!output) throw new Error("no output from rembg");

            return fetch(output);
          })
          .then(function (res) {
            return res.blob();
          })
          .then(function (blob) {
            var reader = new FileReader();
            reader.onloadend = function () {
              var cutoutDataUrl = reader.result;
              localStorage.setItem("rawPhoto", cutoutDataUrl);
              if (uploadPreview && uploadPlaceholder) {
                uploadPreview.src = cutoutDataUrl;
                uploadPreview.style.display = "block";
                uploadPlaceholder.style.display = "none";
              }
              if (uploadMessage) {
                uploadMessage.textContent = "ลบพื้นหลังสำเร็จแล้ว สามารถไปหน้าตั้งค่ารูปได้เลย";
                uploadMessage.className = "hint-text ok";
              }
            };
            reader.readAsDataURL(blob);
          })
          .catch(function (err) {
            console.error(err);
            alert("ลบพื้นหลังไม่สำเร็จ ลองใหม่อีกครั้ง");
          })
          .finally(function () {
            autoRemoveBtn.disabled = false;
            autoRemoveBtn.textContent = "ลบพื้นหลังให้อัตโนมัติ";
          });
      });
    }

    goPreviewBtn.addEventListener("click", function () {
      var raw = localStorage.getItem("rawPhoto");
      if (!raw) {
        alert("กรุณาอัปโหลดรูปก่อน");
        if (uploadMessage) {
          uploadMessage.textContent = "กรุณาอัปโหลดรูปก่อนไปหน้าตั้งค่ารูป";
          uploadMessage.className = "hint-text error";
        }
        return;
      }
      window.location.href = "preview.html";
    });
  }
/* ================== PREVIEW PAGE ================== */
  // shared preview state
  var rawWidth = 0;
  var rawHeight = 0;
  var photoState = { scale: 1, offsetX: 0, offsetY: 0 };
  var overlayState = { scale: 1, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, outfitKey: null };
  var bgColor = "#ffffff";

  function initPreviewPage() {
    var previewImg = document.getElementById("preview-img");
    var placeholder = document.getElementById("preview-placeholder");
    var outfitOverlay = document.getElementById("preview-outfit");
    var sizeInfo = document.getElementById("size-info");
    var generateBtn = document.getElementById("generate-btn");
    var previewMessage = document.getElementById("preview-message");
    var outfitRow = document.getElementById("outfit-row");
    var photoBorder = document.querySelector(".photo-border");
    var photoScaleSlider = document.getElementById("photo-scale");
    var bgColorInput = document.getElementById("bg-color-input");
    var bgResetBtn = document.getElementById("bg-reset-btn");
    var bgSwatches = document.querySelectorAll(".bg-swatch");

    // not on preview page
    if (!previewImg || !generateBtn) return;

    var raw = localStorage.getItem("rawPhoto");
    if (!raw) {
      if (previewMessage) {
        previewMessage.textContent = "ยังไม่มีรูปต้นฉบับ กรุณาอัปโหลดรูปก่อน";
        previewMessage.className = "hint-text error";
      }
      if (placeholder) {
        placeholder.style.display = "block";
        placeholder.textContent = "ยังไม่มีรูป กรุณาอัปโหลดก่อน (กำลังพากลับไปหน้าอัปโหลด)";
      }
      setTimeout(function () {
        window.location.href = "upload.html";
      }, 1600);
      return;
    }

    // load stored background color
    try {
      var stored = localStorage.getItem("previewBgColor");
      if (stored) {
        bgColor = stored;
      }
    } catch (e) {}

    function applyBgToPreview() {
      if (photoBorder) {
        photoBorder.style.background = bgColor;
      }
    }

    function updateActiveSwatch() {
      if (!bgSwatches) return;
      bgSwatches.forEach(function (btn) {
        var c = btn.getAttribute("data-bg-color");
        if (!c) return;
        if (c.toLowerCase() === (bgColor || "").toLowerCase()) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    applyBgToPreview();
    updateActiveSwatch();

    if (bgColorInput) {
      bgColorInput.value = bgColor;
      bgColorInput.addEventListener("input", function () {
        bgColor = bgColorInput.value || "#ffffff";
        try {
          localStorage.setItem("previewBgColor", bgColor);
        } catch (e) {}
        applyBgToPreview();
        updateActiveSwatch();
      });
    }

    if (bgResetBtn) {
      bgResetBtn.addEventListener("click", function () {
        bgColor = "#ffffff";
        if (bgColorInput) bgColorInput.value = bgColor;
        try {
          localStorage.setItem("previewBgColor", bgColor);
        } catch (e) {}
        applyBgToPreview();
        updateActiveSwatch();
      });
    }

    if (bgSwatches && bgSwatches.length) {
      bgSwatches.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var c = btn.getAttribute("data-bg-color");
          if (!c) return;
          bgColor = c;
          try {
            localStorage.setItem("previewBgColor", bgColor);
          } catch (e) {}
          applyBgToPreview();
          updateActiveSwatch();
        });
      });
    }

    // load main photo
    previewImg.onload = function () {
      rawWidth = previewImg.naturalWidth;
      rawHeight = previewImg.naturalHeight;

      if (sizeInfo && rawWidth && rawHeight) {
        sizeInfo.textContent =
          rawWidth + " x " + rawHeight + " px (รูปต้นฉบับ)";
      }

      resetPhotoState();
      updatePhotoAspectFromRaw();
      updatePhotoTransform();
    };
    previewImg.src = raw;
    if (placeholder) placeholder.style.display = "none";

    function resetPhotoState() {
      photoState.scale = 1;
      photoState.offsetX = 0;
      photoState.offsetY = 0;
      if (photoScaleSlider) photoScaleSlider.value = 100;
    }

    function updatePhotoAspectFromRaw() {
      if (!photoBorder || !rawWidth || !rawHeight) return;
      // keep same aspect ratio as original image
      photoBorder.style.aspectRatio = rawWidth + " / " + rawHeight;
    }

    function clampPhotoOffsets() {
      if (!photoBorder || !rawWidth || !rawHeight) return;
      var containerW = photoBorder.clientWidth;
      var containerH = photoBorder.clientHeight;
      var widthRatio = containerW / rawWidth;
      var heightRatio = containerH / rawHeight;
      var baseScaleCover = Math.max(widthRatio, heightRatio);
      var baseScaledW = rawWidth * baseScaleCover * photoState.scale;
      var baseScaledH = rawHeight * baseScaleCover * photoState.scale;
      var maxOffsetX = Math.max(0, (baseScaledW - containerW) / 2);
      var maxOffsetY = Math.max(0, (baseScaledH - containerH) / 2);
      if (photoState.offsetX > maxOffsetX) photoState.offsetX = maxOffsetX;
      if (photoState.offsetX < -maxOffsetX) photoState.offsetX = -maxOffsetX;
      if (photoState.offsetY > maxOffsetY) photoState.offsetY = maxOffsetY;
      if (photoState.offsetY < -maxOffsetY) photoState.offsetY = -maxOffsetY;
    }

    function updatePhotoTransform() {
      clampPhotoOffsets();
      var transform =
        "translate(" +
        photoState.offsetX +
        "px, " +
        photoState.offsetY +
        "px) scale(" +
        photoState.scale +
        ")";
      previewImg.style.transformOrigin = "center center";
      previewImg.style.transform = transform;
    }

    if (photoScaleSlider) {
      photoScaleSlider.addEventListener("input", function () {
        var value = parseInt(photoScaleSlider.value, 10) || 100;
        photoState.scale = value / 100;
        updatePhotoTransform();
      });
    }

    // drag to move main photo
    (function setupPhotoDrag() {
      if (!photoBorder || !previewImg) return;

      var draggingPhoto = false;
      var startX = 0;
      var startY = 0;
      var startOffsetX = 0;
      var startOffsetY = 0;

      function getPointerPos(e) {
        if (e.touches && e.touches.length) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
      }

      function onPhotoDown(e) {
        e.preventDefault();
        draggingPhoto = true;
        var pos = getPointerPos(e);
        startX = pos.x;
        startY = pos.y;
        startOffsetX = photoState.offsetX;
        startOffsetY = photoState.offsetY;
        previewImg.classList.add("dragging");
        if (outfitOverlay) outfitOverlay.style.pointerEvents = "none";
        window.addEventListener("mousemove", onPhotoMove);
        window.addEventListener("touchmove", onPhotoMove, { passive: false });
        window.addEventListener("mouseup", onPhotoUp);
        window.addEventListener("touchend", onPhotoUp);
      }

      function onPhotoMove(e) {
        if (!draggingPhoto) return;
        e.preventDefault();
        var pos = getPointerPos(e);
        var dx = pos.x - startX;
        var dy = pos.y - startY;
        photoState.offsetX = startOffsetX + dx;
        photoState.offsetY = startOffsetY + dy;
        updatePhotoTransform();
      }

      function onPhotoUp() {
        draggingPhoto = false;
        previewImg.classList.remove("dragging");
        if (outfitOverlay) outfitOverlay.style.pointerEvents = "auto";
        window.removeEventListener("mousemove", onPhotoMove);
        window.removeEventListener("touchmove", onPhotoMove);
        window.removeEventListener("mouseup", onPhotoUp);
        window.removeEventListener("touchend", onPhotoUp);
      }

      previewImg.addEventListener("mousedown", onPhotoDown);
      previewImg.addEventListener("touchstart", onPhotoDown, { passive: false });
    })();

    // outfit controls: select, scale, drag
    if (outfitRow && outfitOverlay) {
      var pills = outfitRow.querySelectorAll(".radio-pill");
      var outfitScaleSlider = document.getElementById("outfit-scale");
      var outfitWidthSlider = document.getElementById("outfit-width-scale");
      var outfitHeightSlider = document.getElementById("outfit-height-scale");

      function updateOverlayTransform() {
        var baseScale = overlayState.scale || 1;
        var sx = baseScale * (overlayState.scaleX || 1);
        var sy = baseScale * (overlayState.scaleY || 1);
        outfitOverlay.style.transform =
          "translate(" +
          overlayState.offsetX +
          "px, " +
          overlayState.offsetY +
          "px) scale(" +
          sx +
          ", " +
          sy +
          ")";
      }

      function updateOverlayImage() {
        if (!overlayState.outfitKey) return;
        outfitOverlay.src = "assets/outfits/" + overlayState.outfitKey + ".png";
        outfitOverlay.style.display = "block";
        updateOverlayTransform();
      }

      pills.forEach(function (pill) {
        var input = pill.querySelector("input[type=radio]");
        if (!input) return;
        var key = input.value;
        pill.addEventListener("click", function () {
          overlayState.outfitKey = key;
          overlayState.scale = 1;
          overlayState.scaleX = 1;
          overlayState.scaleY = 1;
          overlayState.offsetX = 0;
          overlayState.offsetY = 0;
          if (outfitScaleSlider) outfitScaleSlider.value = 100;
          if (outfitWidthSlider) outfitWidthSlider.value = 100;
          if (outfitHeightSlider) outfitHeightSlider.value = 100;
          updateOverlayImage();
          updateOverlayTransform();
        });
      });

      if (outfitScaleSlider) {
        outfitScaleSlider.addEventListener("input", function () {
          var value = parseInt(outfitScaleSlider.value, 10) || 100;
          overlayState.scale = value / 100;
          updateOverlayTransform();
        });
      }

      if (outfitWidthSlider) {
        outfitWidthSlider.addEventListener("input", function () {
          var value = parseInt(outfitWidthSlider.value, 10) || 100;
          overlayState.scaleX = value / 100;
          updateOverlayTransform();
        });
      }

      if (outfitHeightSlider) {
        outfitHeightSlider.addEventListener("input", function () {
          var value = parseInt(outfitHeightSlider.value, 10) || 100;
          overlayState.scaleY = value / 100;
          updateOverlayTransform();
        });
      }

      // drag overlay
      (function setupOverlayDrag() {
        var dragging = false;
        var startX = 0;
        var startY = 0;
        var startOffsetX = 0;
        var startOffsetY = 0;

        function getPointerPos(e) {
          if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
          return { x: e.clientX, y: e.clientY };
        }

        function onPointerDown(e) {
          if (!overlayState.outfitKey) return;
          e.preventDefault();
          dragging = true;
          var pos = getPointerPos(e);
          startX = pos.x;
          startY = pos.y;
          startOffsetX = overlayState.offsetX;
          startOffsetY = overlayState.offsetY;
          window.addEventListener("mousemove", onPointerMove);
          window.addEventListener("touchmove", onPointerMove, { passive: false });
          window.addEventListener("mouseup", onPointerUp);
          window.addEventListener("touchend", onPointerUp);
        }

        function onPointerMove(e) {
          if (!dragging) return;
          e.preventDefault();
          var pos = getPointerPos(e);
          var dx = pos.x - startX;
          var dy = pos.y - startY;
          overlayState.offsetX = startOffsetX + dx;
          overlayState.offsetY = startOffsetY + dy;
          updateOverlayTransform();
        }

        function onPointerUp() {
          dragging = false;
          window.removeEventListener("mousemove", onPointerMove);
          window.removeEventListener("touchmove", onPointerMove);
          window.removeEventListener("mouseup", onPointerUp);
          window.removeEventListener("touchend", onPointerUp);
        }

        outfitOverlay.addEventListener("mousedown", onPointerDown);
        outfitOverlay.addEventListener("touchstart", onPointerDown, {
          passive: false,
        });
      })();
    }

    // generate final image
    generateBtn.addEventListener("click", function () {
      if (!rawWidth || !rawHeight) {
        if (previewMessage) {
          previewMessage.textContent =
            "ไม่พบขนาดรูป กรุณาอัปโหลดรูปใหม่อีกครั้ง";
          previewMessage.className = "hint-text error";
        }
        return;
      }

      var size = {
        label: rawWidth + " x " + rawHeight + " px (ตามต้นฉบับ)",
        width: rawWidth,
        height: rawHeight,
      };
      var key = rawWidth + "x" + rawHeight;

      if (previewMessage) {
        previewMessage.textContent = "กำลังสร้างรูป…";
        previewMessage.className = "hint-text";
      }

      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        var ctx = canvas.getContext("2d");

        // background
        ctx.fillStyle = bgColor || "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // crop photo according to photoState
        var containerW = (photoBorder && photoBorder.clientWidth) || canvas.width;
        var containerH = (photoBorder && photoBorder.clientHeight) || canvas.height;
        var widthRatio2 = containerW / rawWidth;
        var heightRatio2 = containerH / rawHeight;
        var baseScaleCover2 = Math.max(widthRatio2, heightRatio2);
        var xCrop =
          -photoState.offsetX / (baseScaleCover2 * photoState.scale);
        var yCrop =
          -photoState.offsetY / (baseScaleCover2 * photoState.scale);
        var cropW =
          containerW / (baseScaleCover2 * photoState.scale);
        var cropH =
          containerH / (baseScaleCover2 * photoState.scale);
        if (xCrop < 0) xCrop = 0;
        if (yCrop < 0) yCrop = 0;
        if (xCrop + cropW > rawWidth) xCrop = rawWidth - cropW;
        if (yCrop + cropH > rawHeight) yCrop = rawHeight - cropH;

        ctx.drawImage(
          img,
          xCrop,
          yCrop,
          cropW,
          cropH,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // outfit draw
        var selectedKey = overlayState.outfitKey;
        if (!selectedKey) {
          var finalUrlPlain = canvas.toDataURL("image/jpeg", 0.9);
          localStorage.setItem("finalPhoto", finalUrlPlain);
          localStorage.setItem("finalSizeLabel", size.label);
          localStorage.setItem("finalSizeKey", key);
          localStorage.setItem("finalOutfit", "");
          if (previewMessage) {
            previewMessage.textContent =
              "สร้างรูปสำเร็จ กำลังไปหน้าดาวน์โหลด…";
            previewMessage.className = "hint-text ok";
          }
          setTimeout(function () {
            window.location.href = "download.html";
          }, 600);
          return;
        }

        var overlayImg = new Image();
        overlayImg.onload = function () {
          var previewW =
            (photoBorder && photoBorder.clientWidth) || size.width;
          var previewH =
            (photoBorder && photoBorder.clientHeight) || size.height;
          var offsetXCanvas =
            (overlayState.offsetX / previewW) * canvas.width;
          var offsetYCanvas =
            (overlayState.offsetY / previewH) * canvas.height;
          var baseScale = overlayState.scale || 1;
          var scaleX = overlayState.scaleX || 1;
          var scaleY = overlayState.scaleY || 1;
          var baseW = canvas.width * baseScale;
          var aspect = overlayImg.naturalHeight / overlayImg.naturalWidth;
          var baseH = baseW * aspect;
          var overlayWCanvas = baseW * scaleX;
          var overlayHCanvas = baseH * scaleY;

          ctx.drawImage(
            overlayImg,
            offsetXCanvas,
            offsetYCanvas,
            overlayWCanvas,
            overlayHCanvas
          );

          var finalUrl = canvas.toDataURL("image/jpeg", 0.9);
          localStorage.setItem("finalPhoto", finalUrl);
          localStorage.setItem("finalSizeLabel", size.label);
          localStorage.setItem("finalSizeKey", key);
          localStorage.setItem("finalOutfit", selectedKey);

          if (previewMessage) {
            previewMessage.textContent =
              "สร้างรูปสำเร็จ กำลังไปหน้าดาวน์โหลด…";
            previewMessage.className = "hint-text ok";
          }
          setTimeout(function () {
            window.location.href = "download.html";
          }, 600);
        };
        overlayImg.onerror = function () {
          // if outfit load fails just save photo
          var finalUrl = canvas.toDataURL("image/jpeg", 0.9);
          localStorage.setItem("finalPhoto", finalUrl);
          localStorage.setItem("finalSizeLabel", size.label);
          localStorage.setItem("finalSizeKey", key);
          localStorage.setItem("finalOutfit", "");
          if (previewMessage) {
            previewMessage.textContent =
              "สร้างรูปสำเร็จ กำลังไปหน้าดาวน์โหลด…";
            previewMessage.className = "hint-text ok";
          }
          setTimeout(function () {
            window.location.href = "download.html";
          }, 600);
        };
        overlayImg.src = "assets/outfits/" + selectedKey + ".png";
      };
      img.onerror = function () {
        if (previewMessage) {
          previewMessage.textContent =
            "ไม่สามารถอ่านรูปได้ กรุณาอัปโหลดใหม่อีกครั้ง";
          previewMessage.className = "hint-text error";
        }
      };
      img.src = raw;
    });
  }

  /* ================== DOWNLOAD PAGE ================== */
  function initDownloadPage() {
    var finalImg = document.getElementById("final-img");
    var link = document.getElementById("download-link");
    var sizeLabelEl = document.getElementById("download-size-label");
    var message = document.getElementById("download-message");
    if (!finalImg || !link) return;

    var finalUrl = localStorage.getItem("finalPhoto");
    var sizeLabel = localStorage.getItem("finalSizeLabel");
    var sizeKey = localStorage.getItem("finalSizeKey");

    if (!finalUrl) {
      if (message) {
        message.textContent = "ยังไม่มีไฟล์รูปที่สร้าง กรุณาไปหน้าตั้งค่ารูปและกดสร้างรูปก่อน";
        message.className = "hint-text error";
      }
      finalImg.style.display = "none";
      setTimeout(function () {
        window.location.href = "preview.html";
      }, 1800);
      return;
    }

    finalImg.src = finalUrl;
    if (sizeLabelEl && sizeLabel) sizeLabelEl.textContent = sizeLabel;

    link.href = finalUrl;
    if (sizeKey) {
      var safeKey = sizeKey.replace(/[^0-9x]/g, "");
      link.download = "photo-id-" + safeKey + ".jpg";
    } else {
      link.download = "photo-id.jpg";
    }

    if (message) {
      message.textContent =
        'ถ้าโหลดไฟล์แล้วไม่ขึ้น ให้คลิกขวาที่รูปตัวอย่างแล้วเลือก "บันทึกรูปภาพเป็น…"';
      message.className = "hint-text";
    }
  }
})();
