<script type="typescript">
  import { sleep, EMAIL_REGEX, TOKEN_KEY } from '$lib/utils';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';

  const NUM_REGEX = /^[0-9]+$/;

  const steps = {
    EMAIL: 1,
    ONE_TIME_CODE: 2,
  };
  let step = steps.EMAIL;
  let currentOtcId = '';

  ////////////////
  // Email step //
  ////////////////
  let email = '';
  let emailIsValid = false;
  let sending = false;

  async function handleSendCode(e: Event) {
    e.preventDefault();
    sending = true;
    const [resp,] = await Promise.all([
      fetch('/otc-send.json', { method: 'POST', body: JSON.stringify({ email }), headers: { 'content-type': 'application/json' } }),
      sleep(300),
    ]);
    if (resp.ok) {
      const data = await resp.json();
      if (data.id) {
        currentOtcId = data.id;
        step = steps.ONE_TIME_CODE;
      }
    }
    sending = false;
  }

  $: emailIsValid = isEmailValid(email);
  function isEmailValid(_email) {
    if (!_email) return false;
    return EMAIL_REGEX.test(_email);
  }

  //////////////
  // OTC step //
  //////////////
  let otc = ['', '', '', ''];
  let otcSending = false;
  let otcIsValid = false;
  $: otcIsValid = otc.every(n => !!n);
  
  function handleOtcInput(e: Event) {
    const target = <HTMLInputElement>e.currentTarget;
    const value = NUM_REGEX.test(target.value) ? target.value : '';

    if (target.id === 'otc-1' && value.length === 4) {
      value.split('').forEach((n, i) => otc[i] = n);
      otc = otc;
      handleOtcSubmit();
      return;
    }

    const newValue = value && value[value.length - 1] || '';
    if (target.id === 'otc-1') {
      otc[0] = newValue;
      if (otc[0]) {
        const next = <HTMLInputElement>document.getElementById('otc-2');
        if (next) next.focus();
      }
    } else if (target.id === 'otc-2') {
      otc[1] = newValue;
      const nextId = otc[1] ? 'otc-3' : 'otc-1';
      const next = <HTMLInputElement>document.getElementById(nextId);
      if (next) next.focus();
    } else if (target.id === 'otc-3') {
      otc[2] = newValue;
      const nextId = otc[2] ? 'otc-4' : 'otc-2';
      const next = <HTMLInputElement>document.getElementById(nextId);
      if (next) next.focus();
    } else if (target.id === 'otc-4') {
      otc[3] = newValue;
      if (!otc[3]) {
        const next = <HTMLInputElement>document.getElementById('otc-3');
        if (next) next.focus();
      }
    }
    otc = otc;

    if (otc.every(n => !!n)) {
      handleOtcSubmit();
    }
  }

  function handleOtcFocus(e: Event) {
    const target = <HTMLInputElement>e.currentTarget;
    target.select();
  }

  function handleOtcKeydown(e: Event) {
    const target = <HTMLInputElement>e.currentTarget;
    const keyCode = (e as any).keyCode as number;
    // Backspace
    if (keyCode === 8 && !target.value) {
      let prevId = '';
      if (target.id === 'otc-4') prevId = 'otc-3';
      if (target.id === 'otc-3') prevId = 'otc-2';
      if (target.id === 'otc-2') prevId = 'otc-1';
      if (prevId) {
        e.preventDefault();
        const prev = document.getElementById(prevId);
        if (prev) prev.focus();
      }
    }
  }

  async function handleOtcSubmit(e?: Event) {
    e && e.preventDefault();
    otcSending = true;
    const [resp,] = await Promise.all([
      fetch('/otc-submit.json', { method: 'POST', body: JSON.stringify({ email, otc: otc.join(''), otcId: currentOtcId }), headers: { 'content-type': 'application/json' } }),
      sleep(300),
    ]);
    if (resp.ok) {
      const data = await resp.json();
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        goto('/');
      }
    }
    otcSending = false;
  }

  function handleBackToEmail() {
    step = steps.EMAIL;
    otc = ['', '', '', ''];
  }
</script>

<div>
  <div class="flex flex-col items-center pt-24">
    <div class="mb-6 text-center">
      <h1 class="text-4xl font-bold">
        Magic login 🪄
      </h1>
    </div>
    {#if step === steps.EMAIL}
      <form out:fade={{ duration: 500 }} on:submit={handleSendCode} class="w-full max-w-md">
        <div class="mb-2">
          <input bind:value={email} disabled={sending} class="w-full rounded border border-gray-300 text-lg px-2 py-2 font-light placeholder:text-gray-300" placeholder="Email" />  
        </div>
        <div>
          <button disabled={sending || !emailIsValid} type="submit" class="w-full flex justify-center items-center rounded text-lg px-2 py-2 text-center bg-blue-600 text-white disabled:opacity-75">
            {#if sending}
              <svg class="animate-spin mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>
                Sending...
              </span>
            {:else}
              <span>
                Send me a code
              </span>
            {/if}
          </button>
        </div>
      </form>
    {:else if step === steps.ONE_TIME_CODE}
      <form on:submit={handleOtcSubmit} in:fade={{ duration: 500, delay: 550 }} id="otc-form" class="max-w-md">
        <div class="flex justify-center space-x-4 mb-3">
          <input on:input={handleOtcInput} on:focus={handleOtcFocus} on:keydown={handleOtcKeydown} disabled={otcSending} bind:value={otc[0]} autocomplete="off" id="otc-1" class="px-2 py-2 border border-gray-300 rounded text-6xl font-extralight w-16 text-center placeholder:text-gray-300" placeholder="0" />
          <input on:input={handleOtcInput} on:focus={handleOtcFocus} on:keydown={handleOtcKeydown} disabled={otcSending} bind:value={otc[1]} autocomplete="off" id="otc-2" class="px-2 py-2 border border-gray-300 rounded text-6xl font-extralight w-16 text-center placeholder:text-gray-300" placeholder="0" />
          <input on:input={handleOtcInput} on:focus={handleOtcFocus} on:keydown={handleOtcKeydown} disabled={otcSending} bind:value={otc[2]} autocomplete="off" id="otc-3" class="px-2 py-2 border border-gray-300 rounded text-6xl font-extralight w-16 text-center placeholder:text-gray-300" placeholder="0" />
          <input on:input={handleOtcInput} on:focus={handleOtcFocus} on:keydown={handleOtcKeydown} disabled={otcSending} bind:value={otc[3]} autocomplete="off" id="otc-4" class="px-2 py-2 border border-gray-300 rounded text-6xl font-extralight w-16 text-center placeholder:text-gray-300" placeholder="0" />
        </div>
        <div class="space-y-2">
          <button disabled={otcSending || !otcIsValid} type="submit" class="w-full flex justify-center items-center rounded text-lg px-2 py-2 text-center bg-blue-600 text-white disabled:opacity-75">
            {#if otcSending}
              <svg class="animate-spin mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>
                Submitting...
              </span>
            {:else}
              <span>
                Submit the code
              </span>
            {/if}
          </button>
          <div class="w-full flex justify-center">
            <button on:click={handleBackToEmail} disabled={otcSending} class="text-center text-lg font-light text-gray-500 hover:text-gray-700 disabled:opacity-75">
              Back to email
            </button>
          </div>
        </div>
      </form>
    {/if}
  </div>
</div>