/**
 * Brown China API — browser client (no UI, no default URL).
 * Call with your Railway (or local) base URL on every request.
 *
 * @example
 * <script src="brown-china-api-client.js"></script>
 * <script>
 *   var API = "https://web-production-7ed4a.up.railway.app";
 *   BrownChinaApi.postChatJson(API, {
 *     agent: "narrator",
 *     message: "Hello",
 *     messages: [],
 *     stream: false
 *   }).then(function (r) { console.log(r.reply); });
 * </script>
 */
(function (global) {
  "use strict";

  function normalizeBase(apiBase) {
    if (!apiBase || typeof apiBase !== "string" || !String(apiBase).trim()) {
      throw new Error(
        "BrownChinaApi: set apiBase to your API root URL (e.g. Railway HTTPS URL)."
      );
    }
    return String(apiBase).trim().replace(/\/$/, "");
  }

  function parseSseBuffer(buffer, onEvent) {
    var parts = buffer.split("\n\n");
    var rest = parts.pop() || "";
    var i;
    var j;
    for (i = 0; i < parts.length; i++) {
      var block = parts[i].trim();
      if (!block) continue;
      var lines = block.split("\n");
      for (j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (line.indexOf("data: ") === 0) {
          try {
            onEvent(JSON.parse(line.slice(6)));
          } catch (e) {
            onEvent({ type: "error", message: "Invalid JSON in SSE: " + line });
          }
        }
      }
    }
    return rest;
  }

  /**
   * POST /chat with stream:false — returns parsed JSON { reply }.
   */
  function postChatJson(apiBase, body) {
    var base = normalizeBase(apiBase);
    return fetch(base + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.assign({ stream: false }, body || {})
      ),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error(
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data)
          );
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  /**
   * POST /chat with stream:true — reads SSE and invokes handlers.
   * handlers: { onDelta(text), onEnd(), onError(message) }
   */
  function postChatStream(apiBase, body, handlers) {
    handlers = handlers || {};
    var base = normalizeBase(apiBase);
    var onDelta = handlers.onDelta || function () {};
    var onEnd = handlers.onEnd || function () {};
    var onError = handlers.onError || function () {};

    return fetch(base + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.assign({ stream: true }, body || {})
      ),
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var err = new Error(t || res.statusText);
          err.status = res.status;
          onError(err.message);
          throw err;
        });
      }
      var reader = res.body && res.body.getReader();
      if (!reader) {
        onError("No response body");
        return Promise.reject(new Error("No response body"));
      }
      var decoder = new TextDecoder();
      var buf = "";
      var assembled = "";

      function onPayload(payload) {
        if (payload.type === "text.delta" && payload.delta) {
          assembled += payload.delta;
          onDelta(payload.delta, assembled);
        } else if (payload.type === "response.end") {
          onEnd(assembled);
        } else if (payload.type === "error") {
          onError(payload.message || JSON.stringify(payload));
        }
      }

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            if (buf.trim()) parseSseBuffer(buf + "\n\n", onPayload);
            return assembled;
          }
          buf += decoder.decode(chunk.value, { stream: true });
          buf = parseSseBuffer(buf, onPayload);
          return pump();
        });
      }
      return pump();
    });
  }

  global.BrownChinaApi = {
    normalizeBase: normalizeBase,
    postChatJson: postChatJson,
    postChatStream: postChatStream,
  };
})(typeof window !== "undefined" ? window : this);
