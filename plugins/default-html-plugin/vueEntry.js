import App from '@np/pack-cli/vueholder';
import { createApp } from 'vue';

const div = document.createElement('div');
div.id = 'app';
document.body.appendChild(div);

createApp(App).mount('#app');
