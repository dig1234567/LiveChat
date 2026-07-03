import MaintenancePage from "./component/MaintenancePage";
import ChatApp from "./ChatApp";

function App() {
  const maintenance = true;

  if (maintenance) {
    return <MaintenancePage />;
  }

  return <ChatApp />;
}

export default App;
