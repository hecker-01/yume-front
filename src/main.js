import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Font Awesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faHome,
  faClipboardList,
  faUserCircle,
  faShoppingCart,
  faTimes,
  faTrash,
  faPlus,
  faMinus,
  faEdit,
  faSignOutAlt,
  faTrashAlt,
  faSave,
  faCheck,
  faSignInAlt,
  faUserPlus,
  faEye,
  faArrowLeft,
  faRedo,
  faCreditCard,
  faBug,
  faCheckCircle,
  faExclamationCircle,
  faChevronRight,
  faSpinner,
  faImage,
  faWallet,
  faUniversity,
  faMobileAlt,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faHome,
  faClipboardList,
  faUserCircle,
  faShoppingCart,
  faTimes,
  faTrash,
  faPlus,
  faMinus,
  faEdit,
  faSignOutAlt,
  faTrashAlt,
  faSave,
  faCheck,
  faSignInAlt,
  faUserPlus,
  faEye,
  faArrowLeft,
  faRedo,
  faCreditCard,
  faBug,
  faCheckCircle,
  faExclamationCircle,
  faChevronRight,
  faSpinner,
  faImage,
  faWallet,
  faUniversity,
  faMobileAlt,
  faMoneyBillWave
);

const app = createApp(App);
app.component("font-awesome-icon", FontAwesomeIcon);
app.use(router);
app.mount("#app");
