// --- ГЛОБАЛЬНЫЙ ЗАПУСК ИГРЫ И МУЗЫКИ ---
// Весь код запускается только после полной загрузки HTML-документа
document.addEventListener('DOMContentLoaded', () => {

    // --- ФОНОВАЯ МУЗЫКА ---
    const bgm = document.getElementById('background-music');
    let isBgmStarted = false;
    let isBgmReadyToPlay = false; // Новая переменная-флаг

    function startBgm() {
        if (!bgm || isBgmStarted) return;
        try {
            bgm.volume = 0.15;
            bgm.loop = true;
            
            // Устанавливаем флаг, что мы готовы играть
            isBgmReadyToPlay = true;
            
            // Пытаемся запустить музыку
            playIfReady();
            
        } catch (e) {
            console.error("Ошибка инициализации музыки:", e);
        }
    }

    // Эта функция будет пытаться запустить музыку, если есть разрешение
    function playIfReady() {
        if (isBgmReadyToPlay && !isBgmStarted) {
            bgm.play().then(() => {
                isBgmStarted = true;
                bgm.addEventListener('ended', () => bgm.currentTime = 0);
                console.log("Фоновая музыка запущена.");
            }).catch((error) => {
                // Если не удалось, ждем ЛЮБОГО действия пользователя
                console.log("Музыка заблокирована. Ждем действия пользователя.", error);
                window.addEventListener('click', finalStart, {once: true});
                window.addEventListener('touchstart', finalStart, {once: true});
                window.addEventListener('keydown', finalStart, {once: true});
            });
        }
    }

    // Эта функция запускает музыку окончательно и убирает слушателей
    function finalStart() {
        if (!isBgmStarted) {
            bgm.play().then(() => {
                isBgmStarted = true;
                console.log("Музыка запущена по клику пользователя.");
            });
        }
    }

    // --- КЛАСС ИГРЫ ---
    class PyaterochkaKliker {
        constructor() {
            // --- ЭЛЕМЕНТЫ ИГРЫ ---
            this.elements = {
                clickArea: document.getElementById('clickable-coin-area'),
                coinDisplay: document.getElementById('coins'),
                shopContainer: document.getElementById('shop-items'),
                resetBtn: document.querySelector('.reset-game'),
                soundClick: document.getElementById('click-sound'),
                soundBuy: document.getElementById('buy-sound')
            };

            if (!this.elements.coinDisplay || !this.elements.shopContainer) {
                console.error("Ошибка загрузки: не найдены основные элементы игры.");
                return;
            }

            // --- ЗАГРУЗКА ПРОГРЕССА ---
            this.coins = parseInt(localStorage.getItem('coins')) || 0;
            this.coinsPerClick = parseInt(localStorage.getItem('coinsPerClick')) || 1;

            // --- МАГАЗИН ---
            this.shopItems = [
                { id: 'milk', name: 'Молоко', price: 60, bought: false },
                { id: 'bread', name: 'Хлеб', price: 50, bought: false },
                { id: 'apples', name: 'Яблоки', price: 40, bought: false },
                { id: 'sausage', name: 'Колбаса', price: 80, bought: false },
                { id: 'water', name: 'Вода', price: 20, bought: false },
                { id: 'cheese', name: 'Сыр', price: 100, bought: false },
                { id: 'juice', name: 'Сок', price: 120, bought: false },
                { id: 'cream', name: 'Сметана', price: 200, bought: false }
            ];

            this.updateDisplay();
            this.renderShop();

            // --- ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ ---
            if (this.elements.clickArea) {
                this.elements.clickArea.addEventListener('click', () => this.onLogoClick());
            }

            if (this.elements.resetBtn) {
                this.elements.resetBtn.addEventListener('click', () => this.resetGame());
            }
        }

        onLogoClick() {
            const randomBonus = Math.floor(Math.random() * 3) + 1;
            const earned = this.coinsPerClick * randomBonus;

            this.coins += earned;
            
            // Обновляем магазин сразу после клика, чтобы активировать новые доступные товары.
            this.updateDisplay();
            this.renderShop(); 
            
            this.playSound(this.elements.soundClick);
        }

        updateDisplay() {
            if (this.elements.coinDisplay) {
                const formatted = new Intl.NumberFormat('ru-RU').format(this.coins);
                this.elements.coinDisplay.textContent = formatted;
                
                this.elements.coinDisplay.style.fontFamily = "'Press Start 2P', cursive";
            }
        }

        saveProgress() {
            localStorage.setItem('coins', this.coins);
            localStorage.setItem('coinsPerClick', this.coinsPerClick);
        }

        buyItem(itemId) {
             const item = this.shopItems.find(i => i.id === itemId);
             if (!item || item.bought) return;
            
             const price = parseInt(item.price);
            
             if (!isNaN(price) && this.coins >= price) {
                
                 if (this.elements.soundBuy) {
                     try {
                         this.elements.soundBuy.currentTime = 0;
                         this.elements.soundBuy.play();
                     } catch (e) {
                         console.log("Звук покупки заблокирован браузером.");
                     }
                 }
                 
                 this.coins -= price;
                 item.bought = true;
                 
                 if (price > 0) {
                     this.coinsPerClick += 1;
                 }
                
                 alert(`${item.name} куплен(а)! Сила клика +1.`);
                
                 this.saveProgress();
                 this.updateDisplay();
                 this.renderShop(); 
             } else {
                 alert('Недостаточно монет!');
             }
         }
         
         resetGame() {
             if (confirm('Сбросить весь прогресс?')) {
                 localStorage.clear();
                 alert('Прогресс сброшен!');
                 window.location.reload(); 
             }
         }
         
         renderShop() {
             if (!this.elements.shopContainer) return;
             let html = '';
             
             for (let item of this.shopItems) {
                 const isBought = item.bought;
                 const isAffordable = (this.coins >= item.price);
                 
                 const btnText = isBought ? "Куплено" : "Купить";
                 const blockClass = isBought || !isAffordable ? 'purchased' : '';
                 
                 html += `
                     <div class="shop-item ${blockClass}" data-id="${item.id}">
                         <h3>${item.name}</h3>
                         <p>Цена: ${item.price} мон.</p>
                         <button class="buy-button" ${isBought || !isAffordable ? 'disabled' : ''}>
                             ${btnText}
                         </button>
                     </div>
                 `;
             }
             
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = html;
             
             while (this.elements.shopContainer.firstChild) {
                 this.elements.shopContainer.removeChild(this.elements.shopContainer.firstChild);
             }
             
             while (tempDiv.firstChild) {
                 this.elements.shopContainer.appendChild(tempDiv.firstChild);
             }
             
             const buttons = document.querySelectorAll('.shop-grid .buy-button');
             buttons.forEach(btn => {
                 btn.addEventListener('click', () => {
                     const card = btn.closest('.shop-item');
                     if (card) {
                         const id = card.dataset.id;
                         if (id) this.buyItem(id);
                     }
                 });
             });
         }
         
         playSound(audioEl) {
             try { if(audioEl) { audioEl.currentTime = 0; audioEl.play(); } }
             catch (e) { console.log("Звук заблокирован."); }
         }
    }

    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
    // 1. Сначала запускаем игру.
    new PyaterochkaKliker();
    
    // 2. Затем, с минимальной задержкой (0 мс), пытаемся запустить музыку.
    // Это помещает запуск музыки в конец очереди задач, после того как игра инициализировалась.
    setTimeout(startBgm, 0);
});