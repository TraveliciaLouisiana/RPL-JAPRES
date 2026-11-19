const sampleMembers = [
  {name:"Arya Dimas Prakoso", npm:"6182601001"},
  {name:"Vivian Kimora", npm:"6182601002"},
  {name:"Prakoso Dimas Arya", npm:"6182601003"},
  {name:"Dimas Prakoso Arya", npm:"6182601004"},
  {name:"Arya Prakoso Dimas", npm:"6182601005"},
  {name:"Ema Si Kucing", npm:"6182601000"}
];
const otherGroupMembers = ["Arya Dimas Prakoso", "Arya Dimas Prakoso", "Arya Dimas Prakoso"];
const groups = [1,2,3,4,5];

document.addEventListener("DOMContentLoaded", () => {
  renderGroups();
  renderOwnGroup();
  document.getElementById("otherGroupsBtn")?.addEventListener("click", () => {
    document.getElementById("otherGroupsSection").scrollIntoView({behavior:"smooth"});
  });
});

function getJoinedGroup() {
  return localStorage.getItem("japresGroup") || "2";
}
function renderOwnGroup() {
  const joined = getJoinedGroup();
  const ownSection = document.getElementById("ownGroupSection");
  const members = document.getElementById("ownMembers");
  const count = document.getElementById("memberCount");
  const summary = document.getElementById("summaryGroup");
  const side = document.getElementById("sidebarGroup");
  if (!joined) {
    ownSection.innerHTML = '<div class="empty-state">Anda belum bergabung dengan kelompok. Silakan pilih kelompok yang tersedia di bawah.</div>';
    count.textContent = "Belum bergabung";
    summary.textContent = "Belum bergabung";
    side.textContent = "Belum bergabung";
    return;
  }
  count.textContent = joined === "2" ? "6 Orang" : "3 Orang";
  summary.textContent = `Kelompok ${joined}`;
  side.textContent = `Kelompok ${joined}`;
  const list = joined === "2" ? sampleMembers : sampleMembers.slice(0,3);
  members.innerHTML = list.map(member => `
    <article class="member-card">
      <div class="member-avatar"><i class="fa-solid fa-user"></i></div>
      <div class="member-details"><strong>${member.name}</strong><span class="member-status">Mahasiswa Aktif</span><small>NPM: ${member.npm}</small></div>
    </article>`).join("");
}

function renderGroups() {
  const container = document.getElementById("groupList");
  const joined = getJoinedGroup();
  container.innerHTML = groups.filter(number => String(number) !== joined).map(number => `
    <article class="group-card">
      <div class="group-actions">
        <span class="group-name"><i class="fa-solid fa-users"></i> Kelompok ${number}</span>
        <button class="join-btn" data-group="${number}"><i class="fa-solid fa-right-to-bracket"></i> Masuk Kelompok</button>
      </div>
      <div class="group-members">
        ${otherGroupMembers.map(name => `<div class="mini-member"><div class="member-avatar"><i class="fa-solid fa-user"></i></div><div><strong>${name}</strong><small>NPM: 6182601001</small></div></div>`).join("")}
      </div>
    </article>`).join("");

  container.querySelectorAll(".join-btn").forEach(button => {
    button.addEventListener("click", () => {
      const selected = button.dataset.group;
      if (!confirm(`Apakah Anda yakin ingin bergabung dengan Kelompok ${selected}?`)) return;
      localStorage.setItem("japresGroup", selected);
      renderOwnGroup();
      renderGroups();
      showToast(`Berhasil bergabung dengan Kelompok ${selected}`);
    });
  });
}