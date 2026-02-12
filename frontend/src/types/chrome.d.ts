// Chrome Extension API types
declare namespace chrome {
  namespace storage {
    namespace local {
      function get(keys?: string | string[] | object): Promise<any>;
      function set(items: object): Promise<void>;
    }
    const onChanged: {
      addListener(callback: (changes: any, areaName: string) => void): void;
      removeListener(callback: (changes: any, areaName: string) => void): void;
    };
  }

  namespace runtime {
    function sendMessage(message: any): Promise<any>;
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: (response: any) => void) => void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: (response: any) => void) => void): void;
    };
    const lastError: { message?: string } | undefined;
  }

  namespace action {
    function setBadgeText(details: { text: string; tabId?: number }): void;
    function setBadgeBackgroundColor(details: { color: string; tabId?: number }): void;
  }

  namespace tabs {
    const onUpdated: {
      addListener(callback: (tabId: number, changeInfo: any, tab: any) => void): void;
      removeListener(callback: (tabId: number, changeInfo: any, tab: any) => void): void;
    };
  }
}
