/*
 * Amara, universalsubtitles.org
 *
 * Copyright (C) 2016 Participatory Culture Foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see
 * http://www.gnu.org/licenses/agpl-3.0.html.
 */

//
// ajax.js -- Amara AJAX functionality

define(['jquery', 'jquery-behaviors', 'jquery-form'], function($) {
    $.behaviors('.ajaxForm', ajaxForm);
    $.behaviors('.ajaxLink', ajaxLink);

    function processAjaxResponse(responseData) {
        // Handles processing our AJAX responses generated by the ui.ajax.AJAXResponseRender class.
        _.each(responseData, function(change) {
            switch(change[0]) {
                case 'replace':
                    var container = $(change[1]);
                    var content = $(change[2]);
                    container.empty().append(content);
                    container.updateBehaviors();
                    break;

                case 'remove':
                    $(change[1]).remove();
                    break;

                case 'showModal':
                    showModal(change[1]).updateBehaviors();
                    break;

                case 'showModalProgress':
                    showModalProgress(change[1], change[2]);
                    break;

                case 'performRequest':
                    setTimeout(function() {
                        $.ajax(change[1], {
                            success: processAjaxResponse
                        });
                    }, change[2]);
                    break;

                case 'clearForm':
                    $(change[1]).clearForm();
                    break;

                case 'reloadPage':
                    $(window).on('beforeunload', scrollAfterReload);
                    window.location.reload();
                    break;
            }
        });
    }

    function scrollAfterReload() {
        $(window).scrollTop(0);
        $(window).off('beforeunload', scrollAfterReload);
    }

    function ajaxForm(form) {
        var submitting = false;
        var sawSecondSubmit = false;
        form = $(form);
        form.add('button', form).ajaxForm({
            beforeSubmit: function(data) {
                if(submitting) {
                    sawSecondSubmit = true;
                    return false;
                }
                submitting = true;
                if(form.hasClass('updateLocation')) {
                    history.pushState(null, "", window.location.protocol + "//" + window.location.host +
                            window.location.pathname + '?' + form.formSerialize());
                }
                if(form.hasClass('copyQuery')) {
                    _.each(getQueryParams(), function(value, name) {
                        data.push({ name: name, value: value });
                    });
                }
                if(form.hasClass('disableInputsOnSubmit')) {
                    $(':input', form).prop('disabled', true);
                }
            },
            complete: function() {
                submitting = false;
                if(sawSecondSubmit) {
                    sawSecondSubmit = false;
                    form.submit();
                }
            },
            success: processAjaxResponse,
            error: function() {
                alert(gettext('Error submitting form'));
                closeCurrentModal();
            }
        });

        if(form.hasClass('updateOnChange')) {
            $(':input', form).change(submitIfChanged);
            $('input[type=text]', form).keyup(submitIfChanged);
        }

        var lastSerialize = form.formSerialize();
        function submitIfChanged() {
            var newSerialize = form.formSerialize();
            if(newSerialize != lastSerialize) {
                lastSerialize = newSerialize;
                form.submit();
            }
        }
    }

    function ajaxLink(link) {
        var link = $(link);

        link.click(function() {
            $.ajax(link.attr('href'), {
                success: processAjaxResponse
            });
            return false;
        });
    }
});
