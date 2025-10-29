document.addEventListener("DOMContentLoaded", () => {
  // --- KONFIGURASI API & ENDPOINTS ---
  const API_PLAYER_DATA = "http://localhost/badas/api_players.php"; // GET Master List & Status
  const API_STATUS = "http://localhost/badas/api_status.php"; // POST Update Status & Reset Markers
  const API_HISTORY = "http://localhost/badas/api_history.php"; // GET/POST History

  // Variabel Global (Akan diisi oleh data dari API)
  let ALL_PLAYER_TIERS = {};
  let ALL_PLAYER_DATA = [];

  // --- VARIABEL KONSTAN ---
  const SELECTED_MARKER = " (TERPILIH)";
  const RESULTS_HTML_KEY = "badmintonResultsHtml";
  let pairingCount = 1;

  // --- FUNGSI ASYNC UTILITY (Digunakan untuk berinteraksi dengan API) ---

  async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Gagal memuat API ${url}. Status: ${response.status}`);
    }
    return response.json();
  }

  async function loadPairedHistory() {
    try {
      return await fetchJSON(API_HISTORY);
    } catch (error) {
      console.error("Gagal memuat riwayat pasangan dari DB:", error);
      return [];
    }
  }

  async function savePairedHistory(newPairs) {
    try {
      await fetchJSON(`${API_HISTORY}?action=add_history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs: newPairs }),
      });
    } catch (error) {
      console.error("Gagal menyimpan riwayat pasangan ke DB:", error);
    }
  }

  // --- FUNGSI UTILITY & LOGIKA PENGACAKAN BERBOBOT ---

  function shuffle(array) {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }

  function hasPairBeenUsed(player1, player2, history) {
    const currentPair = [player1, player2].sort().join("|");
    return history.some((pastPair) => {
      const historyPair = [pastPair[0], pastPair[1]].sort().join("|");
      return historyPair === currentPair;
    });
  }

  function getAvailablePlayers(allNamesArray) {
    return allNamesArray
      .filter((name) => !name.includes(SELECTED_MARKER))
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  // BARU: Hitung frekuensi pemilihan setiap pemain dari riwayat
  function calculatePlayerFrequency(pairedHistory) {
    const frequency = {};

    // Inisialisasi semua pemain (agar semua pemain masuk hitungan, bahkan yang belum pernah bermain)
    ALL_PLAYER_DATA.forEach((p) => {
      frequency[p.name] = 0;
    });

    // Hitung frekuensi dari riwayat pasangan
    pairedHistory.forEach((pair) => {
      const p1 = pair[0];
      const p2 = pair[1];

      if (frequency[p1] !== undefined) frequency[p1]++;
      if (frequency[p2] !== undefined) frequency[p2]++;
    });

    return frequency;
  }

  // --- FUNGSI PEMUATAN DATA UTAMA (Dari Database) ---

  async function fetchPlayerData() {
    try {
      const data = await fetchJSON(API_PLAYER_DATA);

      // Simpan data yang dimuat ke variabel global
      ALL_PLAYER_TIERS = data;
      ALL_PLAYER_DATA = [...data["Tier S"], ...data["Tier A"]];

      // Lanjutkan ke inisialisasi setelah data tersedia
      initializeApplication();
    } catch (error) {
      console.error("Gagal memuat daftar pemain dari PHP/MySQL:", error);
      alert(
        `Koneksi database gagal atau API tidak merespons. Pastikan XAMPP dan API berjalan. Detail: ${error.message}`
      );
    }
  }

  // --- FUNGSI LOGIKA APLIKASI UTAMA (Setelah data Master dimuat) ---

  async function initializeApplication() {
    function getPlayersByTierFromMaster() {
      const tierS_data = ALL_PLAYER_TIERS["Tier S"] || [];
      const tierA_data = ALL_PLAYER_TIERS["Tier A"] || [];

      return {
        S: tierS_data.map((p) => p.name + (p.marker || "")),
        A: tierA_data.map((p) => p.name + (p.marker || "")),
      };
    }

    function loadPlayersFromStorageForIndex() {
      const playersByTier = getPlayersByTierFromMaster();
      return playersByTier.S.concat(playersByTier.A);
    }

    function getAvailablePlayersByTier() {
      const playersByTier = getPlayersByTierFromMaster();

      const availableByTier = {
        S: playersByTier.S.filter((name) => !name.includes(SELECTED_MARKER))
          .map((name) => name.replace(SELECTED_MARKER, "").trim())
          .filter((name) => name.length > 0),

        A: playersByTier.A.filter((name) => !name.includes(SELECTED_MARKER))
          .map((name) => name.replace(SELECTED_MARKER, "").trim())
          .filter((name) => name.length > 0),
      };

      return availableByTier;
    }

    // FUNGSI KHUSUS players.html
    if (document.title.includes("Daftar Pemain")) {
      const tierListContainer = document.getElementById("tier-list-container");
      const totalPlayersSpan = document.getElementById("total-players");

      function cleanInput(rawContent) {
        return rawContent
          .split(/\s*<br\s*\/?>\s*|\n/)
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
      }

      function initPlayerPage() {
        const playersByTier = getPlayersByTierFromMaster();

        let htmlContent = "";
        let totalCount = 0;

        ["Tier S", "Tier A"].forEach((tierName) => {
          const tierKey = tierName === "Tier S" ? "S" : "A";
          const currentList = playersByTier[tierKey];
          const classTier = tierKey.toLowerCase();

          const formattedContent = currentList.join("\n");

          htmlContent += `
                        <div class="tier-group tier-${classTier}">
                            <h3>${tierName}</h3>
                            <div id="editable-${tierKey}" 
                                class="editable-list-area" 
                                contenteditable="true"
                                data-tier="${tierKey}">${formattedContent}</div>
                        </div>
                    `;
          totalCount += currentList.length;
        });

        tierListContainer.innerHTML = htmlContent;
        totalPlayersSpan.textContent = totalCount;

        document
          .querySelectorAll(".editable-list-area")
          .forEach((editableDiv) => {
            editableDiv.addEventListener("input", handleTierInput);
            editableDiv.addEventListener("blur", handleTierInput);
          });
      }

      async function handleTierInput(event) {
        const tierKey = event.currentTarget.getAttribute("data-tier");
        const rawContent = event.currentTarget.innerText;
        const newNames = cleanInput(rawContent);

        console.warn(
          "Edit manual ke database (MySQL) saat ini memerlukan API PUT/DELETE/POST tambahan."
        );

        totalPlayersSpan.textContent = newNames.length;
        await fetchPlayerData();
      }

      initPlayerPage();

      // --- FUNGSI KHUSUS index.html ---
    } else if (document.title.includes("BADAS")) {
      const drawButton = document.getElementById("draw-button");
      const resetStatusButton = document.getElementById("reset-status-button");
      const resetHistoryButton = document.getElementById(
        "reset-history-button"
      );
      const resultsDiv = document.getElementById("results");
      const totalPlayersSpan = document.getElementById("total-players");

      function getPlayerHtml(playerName) {
        const playerData = ALL_PLAYER_DATA.find((p) => p.name === playerName);

        if (!playerData) {
          return `<div class="player-display"><p class="player-name"><b>${playerName}</b><br>(Foto/Data tidak ditemukan)</p></div>`;
        }

        let tier = "N/A";
        if (ALL_PLAYER_TIERS["Tier S"].some((p) => p.name === playerName)) {
          tier = "S";
        } else if (
          ALL_PLAYER_TIERS["Tier A"].some((p) => p.name === playerName)
        ) {
          tier = "A";
        }

        return `
                  <div class="player-display">
                      <img src="${playerData.photoUrl}" alt="${playerData.name}" class="player-photo">
                      <p class="player-name">${playerName} (${tier})</p>
                  </div>
              `;
      }

      async function updateStatusAndSave(selectedNamesRaw) {
        const playersToUpdate = selectedNamesRaw.map((name) => ({
          name: name,
          status: SELECTED_MARKER,
        }));

        await fetchJSON(`${API_STATUS}?action=update_status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players: playersToUpdate }),
        });

        await fetchPlayerData();

        return getAvailablePlayers(
          ALL_PLAYER_DATA.map((p) => p.name + (p.marker || ""))
        );
      }

      // PERBAIKAN KRITIS: Jadikan initDrawPage async
      async function initDrawPage() {
        let allPlayersInTextarea = loadPlayersFromStorageForIndex();
        let availablePlayers = getAvailablePlayers(allPlayersInTextarea);

        const savedHtml = localStorage.getItem(RESULTS_HTML_KEY);
        if (savedHtml) {
          resultsDiv.innerHTML = savedHtml;
          pairingCount = resultsDiv.querySelectorAll(".pairing").length + 1;
        } else {
          resultsDiv.innerHTML = "<h2>Hasil</h2>";
          pairingCount = 1;
        }

        const selectedCount =
          allPlayersInTextarea.length - availablePlayers.length;

        // PERBAIKAN: Gunakan await untuk mendapatkan riwayat yang benar
        const currentHistory = await loadPairedHistory();

        totalPlayersSpan.textContent = availablePlayers.length;
        drawButton.disabled = availablePlayers.length < 4;
        resetStatusButton.style.display = selectedCount > 0 ? "block" : "none";

        // KONDISI TOMBOL RIWAYAT: Pastikan ia menunggu dan memeriksa hasil
        resetHistoryButton.style.display =
          currentHistory.length > 0 ? "block" : "none";

        const statusMessage = resultsDiv.querySelector(".status-message");
        if (statusMessage) statusMessage.remove();

        if (availablePlayers.length < 4) {
          const messageHtml = `<div class="pairing status-message" ><h3>Perhatian!</h3><p>Hanya tersisa ${availablePlayers.length} pemain. Klik **Reset** di bawah ini.</p></div>`;
          resultsDiv.insertAdjacentHTML("afterbegin", messageHtml);
        }
      }

      async function drawPairing() {
        let availableByTier = getAvailablePlayersByTier();
        const pairedHistory = await loadPairedHistory(); // Muat dari DB

        // BARU: Hitung frekuensi untuk seleksi berbobot
        const playerFrequency = calculatePlayerFrequency(pairedHistory);

        // FUNGSI BANTU: Seleksi Pemain Berdasarkan Frekuensi Terendah
        const getWeightedRandomPlayer = (tierList, excludePlayer = null) => {
          let list = excludePlayer
            ? tierList.filter((p) => p !== excludePlayer)
            : tierList;
          if (list.length === 0) return null;

          const sortedList = [...list].sort(
            (a, b) => playerFrequency[a] - playerFrequency[b]
          );

          // Pilih 4 kandidat teratas dengan frekuensi terendah
          const topCandidates = sortedList.slice(
            0,
            Math.min(sortedList.length, 4)
          );

          // Pilih 1 dari kandidat teratas secara acak
          const randomIndex = Math.floor(Math.random() * topCandidates.length);
          return topCandidates[randomIndex];
        };

        const availableS = availableByTier.S;
        const availableA = availableByTier.A;

        // Validasi minimum 2S dan 2A
        if (availableS.length < 2 || availableA.length < 2) {
          const totalAvailable = availableS.length + availableA.length;

          if (totalAvailable < 4) {
            await initDrawPage();
            return;
          }

          const messageHtml = `<div class="pairing status-message" style="border-left-color: #ff4500;"><h3>Gagal Mengacak!</h3><p>Pengacakan berjenjang (S vs A) membutuhkan minimal 2 pemain S dan 2 pemain A. Tersedia: S=${availableS.length}, A=${availableA.length}.</p></div>`;
          resultsDiv.insertAdjacentHTML("afterbegin", messageHtml);
          drawButton.disabled = true;
          return;
        }

        let successfulPairing = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 50;

        let selectedPlayersRaw = [];

        while (!successfulPairing && attempts < MAX_ATTEMPTS) {
          attempts++;

          // 1. Ambil 4 pemain dengan prioritas frekuensi terendah
          let s1 = getWeightedRandomPlayer(availableS);
          let s2 = getWeightedRandomPlayer(availableS, s1);
          let a1 = getWeightedRandomPlayer(availableA);
          let a2 = getWeightedRandomPlayer(availableA, a1);

          if (!s1 || !s2 || !a1 || !a2) {
            // Jika gagal mengambil, gunakan shuffle biasa sebagai fallback (walaupun ini akan mengurangi akurasi)
            shuffle(availableS);
            shuffle(availableA);
            s1 = availableS[0];
            s2 = availableS[1];
            a1 = availableA[0];
            a2 = availableA[1];
          }

          // Validasi Pairing History
          const pairA1_used = hasPairBeenUsed(s1, a1, pairedHistory);
          const pairB1_used = hasPairBeenUsed(s2, a2, pairedHistory);

          const pairA2_used = hasPairBeenUsed(s1, a2, pairedHistory);
          const pairB2_used = hasPairBeenUsed(s2, a1, pairedHistory);

          if (!pairA1_used && !pairB1_used) {
            selectedPlayersRaw = [s1, a1, s2, a2];
            successfulPairing = true;
          } else if (!pairA2_used && !pairB2_used) {
            selectedPlayersRaw = [s1, a2, s2, a1];
            successfulPairing = true;
          }
        }

        if (!successfulPairing) {
          const messageHtml = `<div class="pairing status-message" style="border-left-color: #ff4500;"><h3>Gagal Mengacak!</h3><p>Tidak dapat menemukan 2 pasangan unik (S vs A) tanpa mengulang riwayat dalam ${MAX_ATTEMPTS} percobaan. Silakan Reset Riwayat Pasangan.</p></div>`;
          resultsDiv.insertAdjacentHTML("afterbegin", messageHtml);
          drawButton.disabled = true;
          return;
        }

        const teamA_raw = [selectedPlayersRaw[0], selectedPlayersRaw[1]];
        const teamB_raw = [selectedPlayersRaw[2], selectedPlayersRaw[3]];

        await updateStatusAndSave(selectedPlayersRaw);

        let newHistory = [];
        newHistory.push(teamA_raw);
        newHistory.push(teamB_raw);
        await savePairedHistory(newHistory);

        const teamAHtml =
          getPlayerHtml(teamA_raw[0]) + getPlayerHtml(teamA_raw[1]);
        const teamBHtml =
          getPlayerHtml(teamB_raw[0]) + getPlayerHtml(teamB_raw[1]);
        const pairingId = pairingCount++;

        const html = `
                  <div class="pairing">
                      <div class="match-info">Pertandingan Ke-${pairingId}</div>
                      <div class="teams-container">
                          <div class="team-column-wrapper">
                              <h4>Pasangan 1</h4>
                              <div class="player-pair-row">
                                  ${teamAHtml}
                              </div>
                          </div>
                          
                          <div class="versus">
                              <p>VS</p>
                          </div>
                          
                          <div class="team-column-wrapper">
                              <h4>Pasangan 2</h4>
                              <div class="player-pair-row">
                                  ${teamBHtml}
                              </div>
                          </div>
                      </div>
                  </div>
              `;

        resultsDiv.insertAdjacentHTML("afterbegin", html);
        localStorage.setItem(RESULTS_HTML_KEY, resultsDiv.innerHTML);

        await initDrawPage();
      }

      // LISTENER 1: RESET STATUS (Hanya marker pemain)
      resetStatusButton.addEventListener("click", async () => {
        await fetchJSON(`${API_STATUS}?action=reset_markers`, {
          method: "POST",
        });

        localStorage.removeItem(RESULTS_HTML_KEY);
        resultsDiv.innerHTML = "<h2>Hasil</h2>";
        pairingCount = 1;

        await fetchPlayerData();
        await initDrawPage();
      });

      // LISTENER 2: RESET RIWAYAT (Hanya tabel riwayat_pasangan)
      resetHistoryButton.addEventListener("click", async () => {
        if (
          !confirm(
            "Anda yakin ingin menghapus semua riwayat pasangan? Ini akan memungkinkan pasangan yang sama untuk terbentuk kembali."
          )
        ) {
          return;
        }
        await fetchJSON(`${API_HISTORY}?action=reset_history`, {
          method: "POST",
        });

        await fetchPlayerData();
        await initDrawPage();
      });

      drawButton.addEventListener("click", drawPairing);
      await initDrawPage(); // PANGGILAN INIT SUDAH ASYNC
    }
  }

  // PANGGIL FUNGSI FETCH UTAMA DI AKHIR DOMContentLoaded
  fetchPlayerData();
});
