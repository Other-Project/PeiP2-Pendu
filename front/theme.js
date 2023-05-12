function changeTheme(toDark){
    document.documentElement.dataset.theme = toDark ? "dark" : "light";
    document.documentElement.dispatchEvent(new CustomEvent("theme-changed", { detail: { dark: toDark } }));
}
changeTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', function(e) { changeTheme(e.matches); });
