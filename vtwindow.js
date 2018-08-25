/**
 * A Virtual windows system for the browser written in vanilla js
 * @see https://github.com/victornpb/VtWindow
 * @author Victor N. wwww.victorborges.com
 */
class VtWindow {
    constructor(content, options) {
        
        // private props
        this._id = `instance-${Math.random()}`; //TODO: remove the need for ID or implement propper ID generation
        this._parent = undefined;
        this._mounted = false;
        this._maximized = false;
        this._minimized = false;
        this.el = (()=>{
            const div = document.createElement('div');
            div.innerHTML = `
            <div name="header">
                <span name="title">This is my dope window</span>
                <span name="controls">
                    <button name="popout">^</button>
                    <button name="maximize">+</button>
                    <button name="minimize">_</button>
                    <button name="close">x</button>
                </span>
            </div>
            <div name="body">
                <h1>Hello World!</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
            <div name="footer">
                <div name="grab"></div>
            </div>
            `;
            return div;
        })();

        /**
         * @function $
         * @param  {type} selector {description}
         * @return {type} {description}
         */
        const $ = (selector) => {
            return this.el.querySelector(selector);
        };

        this.DOM = {
            header: $('[name=header]'),
            title: $('[name=title]'),
            controls: $('[name=controls]'),
            body: $('[name=body]'),
            close: $('[name=close]'),
            popout: $('[name=popout]'),
            minimize: $('[name=minimize]'),
            maximize: $('[name=maximize]'),
            resize: $('[name=grab]'),
        };

        //bind events
        this.DOM.close.onclick = this.hide.bind(this)
        this.DOM.popout.onclick = this.popout.bind(this);
        this.DOM.minimize.onclick = this.minimize.bind(this);
        this.DOM.maximize.onclick = this.maximize.bind(this);
        this.DOM.title.ondblclick = this.maximize.bind(this);


            if (this.focused === false && this.isMounted) { //bring to front, move down into body
                this.unmount();
                this.mount();

                const blur = (e) => {
                    if (!this.el.contains(e.target)) {
                        this.blur();
                        document.addEventListener('mousedown', blur)
                    }
                }
                document.addEventListener('mousedown', blur);

                this.focus();
            }
        });

        //init
        this.el.classList.add('vt-window');
        this.el.style.cssText = `
            top: 0px;
            left: 0px;
        `;

        
        //init drag n drop
        this._drag = new Drag(this.DOM.header, this.el);
        this._resize = new Drag(this.DOM.resize, this.el, true);


    }
    mount(parentEl) {
        const parent = (parentEl || document.body);
        parent.appendChild(this.el);
        this.el.classList.add('virtual');
        // modify props only after the append was successful
        this._parent = parent;
        this._mounted = true;
    }
    unmount() {
        this._parent.removeChild(this.el);
        // modify props only after the append was successful
        this._mounted = false;
        // should we clear _parent after unmount? NO! (will break focus, bring to front)
    }
    get isMounted(){
        return this._mounted; //TODO: verify if this.el is inside this._parent
    }
    show() {
        this.el.style.display = '';
    }
    hide() {
        this.el.style.display = 'none';
    }
    minimize() {
        if (this._maximized) {
            this.maximize(false); //restore
        }
        this.el.classList.toggle('minimized', this._minimized);
        this._minimized = !this._minimized;
    }
    get isMinimized(){
        return this._minimized;
    }
    maximize() {
        this._maximized = !this._maximized;
        this.el.classList.toggle('maximized', this._maximized);
        // this.el.style.top = '0';
        // this.el.style.left = '0';
    }
    get isMaximized(){
        return this._maximized;
    }
    popout() {
        //aproximate the view port is in the center of the window
        var wTop = ((window.outerHeight - window.innerHeight) / 2) + window.screenY;
        var wLeft = ((window.outerWidth - window.innerWidth) / 2) + window.screenX;

        var s = `width=${this.el.offsetWidth}, height=${this.el.clientHeight}, top=${this.el.offsetTop + wTop}, left=${this.el.offsetLeft + wLeft}`;
        // console.log(s);

        this.popup = window.open('', this._id, s);

        // this.isMounted = false;
        this.unmount();
        this.popup.document.body.appendChild(this.el);
        this.popup.document.title = this.DOM.title.innerText;

        var popupHead = this.popup.document.getElementsByTagName('head')[0];
        document.querySelectorAll('style,link').forEach((el) => {
            popupHead.appendChild(el.cloneNode(true));
        });

        this.el.classList.add('windowed');
        this.el.classList.remove('virtual');

        this.popup.onbeforeunload = () => {
            this.exitpopout();
        };
    }
    exitpopout() {
        this.el.classList.remove('windowed');
        this.mount();
    }

    setTitle(elm) {
        if (typeof elm === 'string') {
            let div = document.createElement('div');
            div.innerHTML = elm;
            elm = div;
        }
        this.DOM.title.innerHTML = '';
        this.DOM.title.appendChild(elm);
    }

    setBody(elm) {
        if (typeof elm === 'string') {
            let div = document.createElement('div');
            div.innerHTML = elm;
            elm = div;
        }
        this.DOM.body.innerHTML = '';
        this.DOM.body.appendChild(elm);
    }

    focus() {
        this.focused = true;
        this.el.classList.add('focus');
    }
    blur() {
        this.focused = false;
        this.el.classList.remove('focus');
    }



    set closable(v) {
        this.DOM.close.style.display = v ? '' : 'none';
    }
    set minimizable(v) {
        this.DOM.minimize.style.display = v ? '' : 'none';
    }
    set deatachable(v) {
        this.DOM.popout.style.display = v ? '' : 'none';
    }

    set top(v) {
        this.el.style.top = `${v}px`;
    }
    set left(v) {
        this.el.style.left = `${v}px`;
    }
    set width(v) {
        this.el.style.width = `${v}px`;
    }
    set height(v) {
        this.el.style.height = `${v}px`;
    }
}



class Drag {
    constructor(zone, target, r) {
        const that = this;
        this.zone = zone;
        this.target = target;

        var offX, offY, tW, tH;


        this.zone.addEventListener('mousedown', (e) => {
            console.log('onmousedown');

            offX = e.offsetX;
            offY = e.offsetY;

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);

            this.target.classList.add('drag');
        });

        function mouseMoveHandler(e) {
            e.preventDefault();
            console.log('mouseMoveHandler' /* `clientX=${e.clientX} layerX=${e.layerX} offsetX=${e.offsetX} pageX=${e.pageX} screenX=${e.screenX}`, e.target */);

            if (r) {
                let h = e.clientY - target.offsetTop - offY + zone.clientHeight;
                let w = e.clientX - target.offsetLeft - offX + zone.clientWidth;
                // console.log(w, h, `clientX=${target.clientX} layerX=${target.layerX} offsetX=${target.offsetX} pageX=${target.pageX} screenX=${target.screenX} offsetLeft=${target.offsetLeft} scrollLeft=${target.scrollLeft}`);

                that.target.style.height = `${h}px`;
                that.target.style.width = `${w}px`;
            } else {
                let t = e.clientY - offY < 0 ? 0 : e.clientY - offY;
                let l = e.clientX - offX < 0 ? 0 : e.clientX - offX;
                that.target.style.top = `${t}px`;
                that.target.style.left = `${l}px`;
            }
        }

        function mouseUpHandler(e) {
            console.log('mouseUpHandler');
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            that.target.classList.remove('drag');
        }
    }
    enable() {

    }
}

export default VtWindow;
