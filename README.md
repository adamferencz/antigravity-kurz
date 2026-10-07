# Zákaz svačin v informatice! 🛑🥪💻

> Zábavná webová Tower Defense hra na motivy školních přestávek, kde studenti chtějí propašovat nebezpečně mastné a tekuté svačiny do nově zrekonstruované počítačové učebny!

![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-orange?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square)
![Web Audio API](https://img.shields.io/badge/Audio-WebAudioAPI-blue?style=flat-square)
![No Dependencies](https://img.shields.io/badge/Dependencies-0-green?style=flat-square)

---

## 🎯 Cíl hry
Ubraň dveře do **IT Labu 101** před 10 vlnami hladových studentů! Pokud student pronikne dovnitř, omaže klávesnice a monitory a učebna ztratí čistotu. Pokud čistota klesne na 0, hra končí.

---

## 🛡️ Obranné věže (Učitelský sbor & Vybavení)
Každá věž má základní úrovně a na **3. úrovni volbu specializace**:

1. **👨‍🏫 Učitel informatiky (100 ⭐)**
   - Rychlé házení poznámek do žákovské.
   - *Specializace A:* **Pětka v Bakalářích** – 35% šance na kritický zásah (3x poškození).
   - *Specializace B:* **Hromada referátů** – Zasáhne 3 studenty najednou.

2. **🧹 Školník s mopem (140 ⭐)**
   - Vytře podlahu mýdlem – louže studenty zpomalí o 50 %.
   - *Specializace A:* **Mýdlová kalamita** – Zpomalení na 30 % a šance, že student uklouzne o kus zpátky!
   - *Specializace B:* **Průmyslový smeták** – Masivní plošný úder do země.

3. **📡 Wi-Fi Router (200 ⭐)**
   - Vypne Wi-Fi signál – studenti propadnou panice a zastaví se (Stun).
   - *Specializace A:* **Zákaz TikToku (Firewall)** – Dlouhý stun (2.6s).
   - *Specializace B:* **Elektrický ráz** – Řetězový blesk mezi 4 studenty.

4. **🖨️ Zaseknutá Tiskárna (260 ⭐)**
   - Chrlí balíky xeroxového papíru a horký toner.
   - *Specializace A:* **Toxický tonerový mrak** – Trvalé DoT poškození kouřem.
   - *Specializace B:* **Papírová lavina** – Těžké bedny papíru s velkým plošným dopadem.

---

## 🥪 Nepřátelé (Svačináři)
- **🥪 Prvák s rohlíkem a Májkou:** Základní student.
- **⚡ Sprinter na Monsteru:** Dvojnásobná rychlost.
- **🥔 Gamer s chipsy:** Po zničení se rozsype na 3 malé rychlé **Drobky**!
- **🍕 Trio s krabicí pizzy:** Želví formace s vysokým HP.
- **🌯 Kebab Boss:** Alobalový štít odrazí první 4 zásahy.
- **🍗 Maturant Boss:** 1600 HP, zničí 5 životů. Při 50% HP přejde do berserk běhu!

---

## 🎮 Ovládání & Schopnosti
- **Klávesy 1, 2, 3, 4:** Výběr věže k postavení
- **Klávesa Q (📢 Školní rozhlas):** Zastaví všechny studenty na chodbě (plošný stun na 4s)
- **Klávesa W (☕ Káva ze sborovny):** Zdvojnásobí rychlost útoků všech věží na 8s
- **Mezerník:** Pauza / Spuštění hry
- **🧽 Hadřík na monitoru:** Pokud student projde, zanechá mastný flek. Kliknutím na flek ho utřete a získáte **+10 Kázeň**!

---

## 🚀 Jak spustit
Otevřete `index.html` v libovolném moderním webovém prohlížeči (žádné instalace ani servery nejsou nutné), nebo spusťte lokální server:
```bash
python -m http.server 8080
```
a otevřete `http://localhost:8080`.
